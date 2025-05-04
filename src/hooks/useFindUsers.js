import React from 'react'
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

// Cache for recently searched results to improve performance
const searchCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const useFindUsers = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem('recentUserSearches');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Save recent searches to localStorage
    useEffect(() => {
        localStorage.setItem('recentUserSearches', JSON.stringify(recentSearches));
    }, [recentSearches]);

    // Add a successful search to recent searches
    const addToRecentSearches = (user) => {
        if (!user) return;
        
        // Only save if it has a username or display name
        const displayValue = user.username || user.displayName;
        if (!displayValue) return;
        
        // Add to start of array, remove duplicates, keep max 10
        setRecentSearches(prev => {
            const filtered = prev.filter(item => 
                item.id !== user.id
            );
            return [
                { id: user.id, name: displayValue, photoURL: user.photoURL }, 
                ...filtered
            ].slice(0, 10);
        });
    };

    // Remove a search from history
    const removeFromRecentSearches = (userId) => {
        setRecentSearches(prev => prev.filter(item => item.id !== userId));
    };

    // Clear all search history
    const clearSearchHistory = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentUserSearches');
    };

    // Search for users by username, displayName, or bio
    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setUsers([]);
            return;
        }

        setLoading(true);
        setError(null);
        setSearchQuery(searchTerm);

        // Check cache first
        const cacheKey = searchTerm.toLowerCase();
        const cachedResult = searchCache.get(cacheKey);
        
        if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_EXPIRY)) {
            setUsers(cachedResult.data);
            setLoading(false);
            return;
        }

        try {
            const usersRef = collection(firestore, 'users');
            let allResults = [];
            
            // Search by username (case insensitive using range query)
            const lowerSearchTerm = searchTerm.toLowerCase();
            const upperSearchTerm = searchTerm.toLowerCase() + '\uf8ff';
            
            // Username search
            const usernameQuery = query(
                usersRef,
                where('username', '>=', lowerSearchTerm),
                where('username', '<=', upperSearchTerm),
                limit(15)
            );
            
            // Display name search
            const displayNameQuery = query(
                usersRef,
                where('displayName', '>=', lowerSearchTerm),
                where('displayName', '<=', upperSearchTerm),
                limit(15)
            );
            
            // Execute all queries
            const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
                getDocs(usernameQuery),
                getDocs(displayNameQuery)
            ]);
            
            // Process results from all queries
            const processSnapshot = (snapshot) => {
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            };
            
            const usernameResults = processSnapshot(usernameSnapshot);
            const displayNameResults = processSnapshot(displayNameSnapshot);
            
            // Combine and deduplicate results
            const combinedResults = [...usernameResults];
            
            // Add display name results if not already included
            displayNameResults.forEach(user => {
                if (!combinedResults.some(existingUser => existingUser.id === user.id)) {
                    combinedResults.push(user);
                }
            });
            
            // Sort results by relevance (exact username matches first, then display name)
            const sortedResults = combinedResults.sort((a, b) => {
                // Exact username match gets highest priority
                const aUsernameMatch = a.username && a.username.toLowerCase() === lowerSearchTerm;
                const bUsernameMatch = b.username && b.username.toLowerCase() === lowerSearchTerm;
                
                if (aUsernameMatch && !bUsernameMatch) return -1;
                if (!aUsernameMatch && bUsernameMatch) return 1;
                
                // Then username starts with search term
                const aUsernameStartsWith = a.username && a.username.toLowerCase().startsWith(lowerSearchTerm);
                const bUsernameStartsWith = b.username && b.username.toLowerCase().startsWith(lowerSearchTerm);
                
                if (aUsernameStartsWith && !bUsernameStartsWith) return -1;
                if (!aUsernameStartsWith && bUsernameStartsWith) return 1;
                
                // Then display name matches
                const aDisplayNameMatch = a.displayName && a.displayName.toLowerCase() === lowerSearchTerm;
                const bDisplayNameMatch = b.displayName && b.displayName.toLowerCase() === lowerSearchTerm;
                
                if (aDisplayNameMatch && !bDisplayNameMatch) return -1;
                if (!aDisplayNameMatch && bDisplayNameMatch) return 1;
                
                return 0;
            });
            
            // Limit the final results
            const limitedResults = sortedResults.slice(0, 10);
            
            // Update cache
            searchCache.set(cacheKey, {
                data: limitedResults,
                timestamp: Date.now()
            });
            
            // Set the search results
            setUsers(limitedResults);
        } catch (err) {
            console.error('Error searching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Clear search results
    const clearSearch = () => {
        setUsers([]);
        setSearchQuery('');
    };

    return {
        loading,
        error,
        users,
        searchQuery,
        recentSearches,
        searchUsers,
        clearSearch,
        addToRecentSearches,
        removeFromRecentSearches,
        clearSearchHistory
    };
};

export default useFindUsers;
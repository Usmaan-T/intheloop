import React from 'react'
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt, getCountFromServer } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

// Cache for recently searched results to improve performance
const searchCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const useFindUsers = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debugInfo, setDebugInfo] = useState(null);
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

    // Check if the users collection exists and has data when component mounts
    useEffect(() => {
        const checkUsersCollection = async () => {
            try {
                const usersRef = collection(firestore, 'users');
                const snapshot = await getCountFromServer(usersRef);
                const count = snapshot.data().count;
                
                console.log(`[useFindUsers] Users collection exists with ${count} documents`);
                setDebugInfo(prev => ({
                    ...prev,
                    usersCount: count,
                    collectionChecked: true
                }));
                
                // If we have fewer than 50 users, fetch them all to see their structure
                if (count > 0 && count < 10) {
                    const sampleQuery = query(usersRef, limit(5));
                    const sampleSnapshot = await getDocs(sampleQuery);
                    const sampleUsers = sampleSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    console.log('[useFindUsers] Sample user data:', 
                        JSON.stringify(sampleUsers, null, 2).substring(0, 1000) + '...');
                    
                    // Save field names for debugging
                    const fieldNames = new Set();
                    sampleUsers.forEach(user => {
                        Object.keys(user).forEach(key => fieldNames.add(key));
                    });
                    
                    setDebugInfo(prev => ({
                        ...prev,
                        sampleUsers: sampleUsers.length > 0 ? sampleUsers.slice(0, 2) : [],
                        userFields: Array.from(fieldNames)
                    }));
                }
            } catch (err) {
                console.error('[useFindUsers] Error checking users collection:', err);
                setDebugInfo(prev => ({
                    ...prev,
                    collectionError: err.message
                }));
            }
        };
        
        checkUsersCollection();
    }, []);

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

        console.log(`[useFindUsers] Searching for users with term: "${searchTerm}"`);
        setLoading(true);
        setError(null);
        setSearchQuery(searchTerm);

        // Check cache first
        const cacheKey = searchTerm.toLowerCase();
        const cachedResult = searchCache.get(cacheKey);
        
        if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_EXPIRY)) {
            console.log('[useFindUsers] Using cached results:', cachedResult.data.length, 'users found');
            setUsers(cachedResult.data);
            setLoading(false);
            return;
        }

        try {
            console.log('[useFindUsers] Fetching from Firestore...');
            const usersRef = collection(firestore, 'users');
            
            // First check if the collection has any documents
            const countSnapshot = await getCountFromServer(usersRef);
            const totalUsers = countSnapshot.data().count;
            console.log(`[useFindUsers] Total users in collection: ${totalUsers}`);
            
            // If no users exist, we can stop here
            if (totalUsers === 0) {
                console.warn('[useFindUsers] No users found in the collection');
                setError('No users exist in the database');
                setLoading(false);
                return;
            }

            // USE BOTH STRATEGIES IN PARALLEL FOR MORE RELIABLE RESULTS
            const results = [];
            const lowerSearchTerm = searchTerm.toLowerCase();
            
            // STRATEGY 1: Use direct Firestore query for prefix matching
            try {
                // Always fetch more results than we need to ensure we don't miss matches
                const batchSize = Math.min(100, totalUsers);
                
                // Fetch users sorted by username for prefix matching
                const prefixQuery = query(
                    usersRef,
                    orderBy('username'),
                    startAt(lowerSearchTerm),
                    endAt(lowerSearchTerm + '\uf8ff'),
                    limit(batchSize)
                );
                
                console.log('[useFindUsers] Executing prefix query with term:', lowerSearchTerm);
                const prefixSnapshot = await getDocs(prefixQuery);
                
                if (!prefixSnapshot.empty) {
                    const prefixResults = prefixSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        matchSource: 'prefix'
                    }));
                    console.log(`[useFindUsers] Prefix query returned ${prefixResults.length} results`);
                    
                    // Add to our combined results
                    prefixResults.forEach(user => {
                        if (!results.some(r => r.id === user.id)) {
                            results.push(user);
                        }
                    });
                }
            } catch (err) {
                console.warn('[useFindUsers] Error with prefix query, continuing with backup strategy:', err);
                // Continue to backup strategy
            }
            
            // STRATEGY 2: Fetch a batch of users and filter client-side
            try {
                // Limit based on collection size to avoid excessive data transfer
                const batchLimit = Math.min(50, totalUsers);
                
                // Fetch the most recent users first (they're more likely to be searched for)
                const backupQuery = query(
                    usersRef,
                    orderBy('createdAt', 'desc'),
                    limit(batchLimit)
                );
                
                console.log(`[useFindUsers] Executing backup query with limit ${batchLimit}`);
                const backupSnapshot = await getDocs(backupQuery);
                
                if (!backupSnapshot.empty) {
                    // Filter users client-side
                    const backupResults = backupSnapshot.docs
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            matchSource: 'backup'
                        }))
                        .filter(user => {
                            try {
                                // Search in all relevant fields
                                const username = (user.username || '').toLowerCase();
                                const displayName = (user.displayName || '').toLowerCase();
                                const bio = (user.bio || '').toLowerCase();
                                const email = (user.email || '').toLowerCase();
                                
                                return username.includes(lowerSearchTerm) || 
                                       displayName.includes(lowerSearchTerm) || 
                                       bio.includes(lowerSearchTerm) || 
                                       email.includes(lowerSearchTerm);
                            } catch (err) {
                                console.error('[useFindUsers] Error filtering user:', err);
                                return false;
                            }
                        });
                    
                    console.log(`[useFindUsers] Backup strategy found ${backupResults.length} matches`);
                    
                    // Add unique results to our combined set
                    backupResults.forEach(user => {
                        if (!results.some(r => r.id === user.id)) {
                            results.push(user);
                        }
                    });
                }
            } catch (err) {
                console.error('[useFindUsers] Error with backup query:', err);
                // Continue with whatever results we have
            }
            
            // STRATEGY 3: One more attempt if we still have no results
            if (results.length === 0) {
                try {
                    console.log('[useFindUsers] No results from first strategies, trying one more approach');
                    
                    // Get a larger batch and do more aggressive matching
                    const lastResortQuery = query(
                        usersRef,
                        limit(Math.min(totalUsers, 150))
                    );
                    
                    const lastResortSnapshot = await getDocs(lastResortQuery);
                    
                    // Very permissive matching
                    const lastResortResults = lastResortSnapshot.docs
                        .map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            matchSource: 'lastResort'
                        }))
                        .filter(user => {
                            // Check if any serializable field contains the search term
                            try {
                                const userObj = JSON.stringify(user).toLowerCase();
                                return userObj.includes(lowerSearchTerm);
                            } catch (err) {
                                return false;
                            }
                        });
                    
                    console.log(`[useFindUsers] Last resort found ${lastResortResults.length} matches`);
                    
                    // Add unique results
                    lastResortResults.forEach(user => {
                        if (!results.some(r => r.id === user.id)) {
                            results.push(user);
                        }
                    });
                } catch (err) {
                    console.error('[useFindUsers] Error with last resort query:', err);
                }
            }
            
            console.log(`[useFindUsers] Total combined results: ${results.length}`);
            
            // Sort results by relevance
            const sortedResults = results.sort((a, b) => {
                // Exact matches first
                const aUsername = (a.username || '').toLowerCase();
                const bUsername = (b.username || '').toLowerCase();
                const aDisplayName = (a.displayName || '').toLowerCase();
                const bDisplayName = (b.displayName || '').toLowerCase();
                
                // Exact username match
                if (aUsername === lowerSearchTerm && bUsername !== lowerSearchTerm) return -1;
                if (aUsername !== lowerSearchTerm && bUsername === lowerSearchTerm) return 1;
                
                // Username starts with search term
                if (aUsername.startsWith(lowerSearchTerm) && !bUsername.startsWith(lowerSearchTerm)) return -1;
                if (!aUsername.startsWith(lowerSearchTerm) && bUsername.startsWith(lowerSearchTerm)) return 1;
                
                // Display name exact match
                if (aDisplayName === lowerSearchTerm && bDisplayName !== lowerSearchTerm) return -1;
                if (aDisplayName !== lowerSearchTerm && bDisplayName === lowerSearchTerm) return 1;
                
                // Display name starts with search term
                if (aDisplayName.startsWith(lowerSearchTerm) && !bDisplayName.startsWith(lowerSearchTerm)) return -1;
                if (!aDisplayName.startsWith(lowerSearchTerm) && bDisplayName.startsWith(lowerSearchTerm)) return 1;
                
                // Prefix matches come before backup matches
                const aPrefixMatch = a.matchSource === 'prefix';
                const bPrefixMatch = b.matchSource === 'prefix';
                if (aPrefixMatch && !bPrefixMatch) return -1;
                if (!aPrefixMatch && bPrefixMatch) return 1;
                
                // Alphabetical within same match type
                return (aUsername || aDisplayName || '').localeCompare(bUsername || bDisplayName || '');
            });
            
            // Limit the final results
            const limitedResults = sortedResults.slice(0, 10);
            
            // Log the final results for debugging
            console.log('[useFindUsers] Final sorted results:', limitedResults.map(u => ({
                id: u.id,
                username: u.username || '(no username)',
                displayName: u.displayName || '(no displayName)',
                matchSource: u.matchSource
            })));
            
            // Update the debug info
            setDebugInfo(prev => ({
                ...prev,
                lastSearch: {
                    term: searchTerm,
                    normalizedTerm: lowerSearchTerm,
                    strategyResults: {
                        prefix: results.filter(r => r.matchSource === 'prefix').length,
                        backup: results.filter(r => r.matchSource === 'backup').length,
                        lastResort: results.filter(r => r.matchSource === 'lastResort').length
                    },
                    totalMatches: results.length,
                    finalResults: limitedResults.length
                }
            }));
            
            // Clean up the results by removing the matchSource field
            const cleanResults = limitedResults.map(({matchSource, ...user}) => user);
            
            // Update cache
            searchCache.set(cacheKey, {
                data: cleanResults,
                timestamp: Date.now()
            });
            
            // Set the search results
            setUsers(cleanResults);
        } catch (err) {
            console.error('[useFindUsers] Error searching users:', err);
            setError(`Error searching users: ${err.message}`);
            setDebugInfo(prev => ({
                ...prev,
                lastError: {
                    message: err.message,
                    stack: err.stack,
                    time: new Date().toISOString()
                }
            }));
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
        debugInfo,
        searchUsers,
        clearSearch,
        addToRecentSearches,
        removeFromRecentSearches,
        clearSearchHistory
    };
};

export default useFindUsers;
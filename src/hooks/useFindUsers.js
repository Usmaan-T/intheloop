import React from 'react'
import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';


const useFindUsers = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Search for users by username or email
    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setUsers([]);
            return;
        }

        setLoading(true);
        setError(null);
        setSearchQuery(searchTerm);

        try {
            // Create a query to search by username (case insensitive if possible)
            const usersRef = collection(firestore, 'users');
            
            // Using a simple startsWith query for username
            const usernameQuery = query(
                usersRef,
                where('username', '>=', searchTerm),
                where('username', '<=', searchTerm + '\uf8ff'),
                limit(10)
            );
            
            const usernameSnapshot = await getDocs(usernameQuery);
            
            const usersData = usernameSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Set the search results
            setUsers(usersData);
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
        searchUsers,
        clearSearch
    };
};

export default useFindUsers;
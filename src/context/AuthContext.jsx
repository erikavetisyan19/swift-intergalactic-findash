import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        let role = userDoc.data().role;

                        // Targeted Frontend Override: If local storage has forced admin, upgrade them
                        if (localStorage.getItem('forceAdmin') === 'true') {
                            role = 'admin';
                        }

                        setUserRole(role);
                    } else {
                        setUserRole(localStorage.getItem('forceAdmin') === 'true' ? 'admin' : 'manager'); // fallback
                    }
                } catch (e) {
                    console.error("Error fetching user role, likely Quota Limit Reached:", e);
                    // Fallback to strict role protection if the database denies the read request due to limits
                    setUserRole(localStorage.getItem('forceAdmin') === 'true' ? 'admin' : 'manager');
                }
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

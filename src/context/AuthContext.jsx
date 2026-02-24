import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function refreshMe() {
        try {
            const data = await authApi.me();
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refreshMe();
    }, []);

    const value = useMemo(() => {
        const isAuthenticated = !!user;
        const mustChangePassword = user?.status === 'must_change_password';

        return {
            user,
            loading,
            isAuthenticated,
            mustChangePassword,

            login: async (email, password) => {
                const data = await authApi.login(email, password);
                setUser(data.user);
                return data.user;
            },

            logout: async () => {
                await authApi.logout();
                setUser(null);
            },

            changePassword: async (currentPassword, newPassword) => {
                const data = await authApi.changePassword(
                    currentPassword,
                    newPassword,
                );
                setUser(data.user); // status diventa "active"
                return data.user;
            },

            refreshMe,
        };
    }, [user, loading]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

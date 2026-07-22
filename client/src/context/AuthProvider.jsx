import { useEffect, useState } from "react";
import api from "../api/axios";
import AuthContext from "./auth-context";

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data.data);
        } catch {
            setUser(null);
        }
    };

    const refreshAuth = async () => {
        await fetchUser();
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setUser(null);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            await fetchUser();
            setLoading(false);
        };

        initializeAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                logout,
                fetchUser,
                refreshAuth,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
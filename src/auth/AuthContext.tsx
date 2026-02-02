"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = "http://localhost:5147/api";

interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    canManage: () => boolean;
}

interface RegisterData {
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT token and extract claims
function decodeJwtToken(token: string): {
    user: Partial<User>;
    permissions: string[];
    role: string;
} {
    try {
        // Split the token and get the payload (middle part)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        // Extract user info from claims
        // These are the standard claim URIs used by .NET Identity
        const user: Partial<User> = {
            username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
            email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
            id: parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
        };

        // Get role
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Employee';

        // Get permissions - can be string or array
        let permissions: string[] = [];
        const permissionClaim = payload['Permission'];
        if (Array.isArray(permissionClaim)) {
            permissions = permissionClaim;
        } else if (typeof permissionClaim === 'string') {
            permissions = [permissionClaim];
        }

        return { user, permissions, role };
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return { user: {}, permissions: [], role: 'Employee' };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
            // Verify token is not expired
            try {
                const base64Url = storedToken.split('.')[1];
                const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));

                // Check expiration
                if (payload.exp && payload.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } else {
                    // Token expired, clear storage
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                }
            } catch {
                // Invalid token, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok && result.data?.token) {
                const newToken = result.data.token;

                // Decode the JWT to get user info and permissions
                const { user: decodedUser, permissions, role } = decodeJwtToken(newToken);

                const userWithPermissions: User = {
                    id: decodedUser.id || 0,
                    username: decodedUser.username || username,
                    email: decodedUser.email || '',
                    firstName: '', // Not in token - could fetch from profile API
                    lastName: '',
                    role: role,
                    permissions: permissions,
                };

                setToken(newToken);
                setUser(userWithPermissions);

                localStorage.setItem('authToken', newToken);
                localStorage.setItem('authUser', JSON.stringify(userWithPermissions));

                return { success: true, message: 'Login successful' };
            } else {
                return { success: false, message: result.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${API_BASE}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    phone: data.phone,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    isActive: true,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Auto-login after registration
                return await login(data.username, data.password);
            } else {
                return { success: false, message: result.message || result.data || 'Registration failed' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        // Admin has all permissions
        if (user.role === 'Admin') return true;
        return user.permissions.includes(permission);
    };

    // Check if user can modify data (has any Manage permission or is Admin)
    const canManage = (): boolean => {
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return user.permissions.some(p => p.includes('.Manage'));
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasPermission,
        canManage,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper hook for API calls with auth token
export function useAuthFetch() {
    const { token, logout } = useAuth();

    const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const headers: HeadersInit = {
            ...(options.headers || {}),
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        // If 401, token is invalid/expired - logout
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    };

    return authFetch;
}
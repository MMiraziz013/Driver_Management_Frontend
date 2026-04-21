import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    // Show loading spinner while checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show login or register page
    if (!isAuthenticated) {
        if (showRegister) {
            return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
        }
        return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
    }

    // If authenticated, render the app
    return <>{children}</>;
}
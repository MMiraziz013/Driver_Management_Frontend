'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DriversPage } from '@/components/drivers/DriversPage';
import { VehicleTypesPage } from '@/components/vehicle-types/VehicleTypePage';
import { CarsPage } from '@/components/cars/CarsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';

// Auth imports
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import {  LoginPage } from '@/auth/LoginPage';
import { RegisterPage } from '@/auth/RegisterPage';
import { NoPermissionBanner } from '@/auth/PermissionComponents';
import { Loader2 } from 'lucide-react';

// Import Header that uses auth
import { Header } from '@/components/Header';

type Page = 'drivers' | 'vehicle-types' | 'cars' | 'reports' | 'settings';

// Loading component
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading...</p>
            </div>
        </div>
    );
}

// Main authenticated app content
function AuthenticatedApp() {
    const [currentPage, setCurrentPage] = useState<Page>('reports');
    const { canManage } = useAuth();

    const renderPage = () => {
        switch (currentPage) {
            case 'drivers':
                return <DriversPage />;
            case 'vehicle-types':
                return <VehicleTypesPage />;
            case 'cars':
                return <CarsPage />;
            case 'reports':
                return <ReportsPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <DriversPage />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                {!canManage() && <NoPermissionBanner />}
                <main className="flex-1 overflow-y-auto p-8">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

// Auth gate component - handles login/register/loading states
function AuthGate() {
    const { isAuthenticated, isLoading } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    // Show loading while checking auth state
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Not authenticated - show login or register
    if (!isAuthenticated) {
        if (showRegister) {
            return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
        }
        return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
    }

    // Authenticated - show the app
    return <AuthenticatedApp />;
}

// Root App component - AuthProvider must wrap everything
export default function App() {
    return (
        <AuthProvider>
            <AuthGate />
        </AuthProvider>
    );
}
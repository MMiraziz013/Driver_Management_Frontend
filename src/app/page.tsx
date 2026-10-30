// app/page.tsx

"use client";

import React, { useCallback, useEffect, useState } from 'react';

// Auth imports - useAuth will work because AuthProvider is in layout.tsx
import { useAuth } from '@/auth/AuthContext';
import { LoginPage } from '@/auth/LoginPage';
import { RegisterPage } from '@/auth/RegisterPage';
import { NoPermissionBanner } from '@/auth/PermissionComponents';
import { Loader2 } from 'lucide-react';
import { BonusesPage } from '@/components/bonuses/BonusesPage';
import { BonusSettingsPage } from '@/components/bonuses/BonusSettingsPage';
import { FuelSettingsPage } from '@/components/fuel/FuelSettingsPage';
import CompaniesPage from '@/components/companies/CompaniesPage';

// Sidebar components - import Page type from Sidebar to avoid duplicate type definitions
import {
    SidebarProvider,
    Sidebar as StyledSidebar,
    SidebarInset,
    SidebarTrigger,
    type Page,
} from '@/components/Sidebar';

// Import all page and header components
import { Header } from '@/components/Header';
import { DriversPage } from '@/components/drivers/DriversPage';
import { VehicleTypesPage } from "@/components/vehicle-types/VehicleTypePage";
import { CarsPage } from "@/components/cars/CarsPage";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ServiceTypesPage } from "@/components/service_types/ServiceTypesPage";

import { DriverVacationsPage } from '@/components/drivers/DriverVacationPage';
import {TripsPage} from "@/components/trips/TripsPage";
import AccountingPage from '@/components/accounting/AccountingPage';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';


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

// Helper wrapper to ensure the Header works inside SidebarInset
function HeaderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center p-4 border-b">
            {children}
        </div>
    );
}

const PAGE_TITLES: Record<Page, string> = {
    'drivers': 'Drivers',
    'vehicle-types': 'Vehicle Types',
    'cars': 'Cars',
    'reports': 'Reports',
    'settings': 'Settings',
    'service-types': 'Service Types',
    'vacations': 'Vacations',
    'trips': 'Trips',
    'bonuses': 'Bonuses',
    'bonus-settings': 'Bonus Settings',
    'fuel-settings': 'Fuel Settings',
    'accounting': 'Accounting',
    'companies': 'Companies',
};

const DEFAULT_PAGE: Page = 'reports';

function pageFromHash(): Page {
    const hash = window.location.hash.slice(1);
    return hash in PAGE_TITLES ? hash as Page : DEFAULT_PAGE;
}

// Current page lives in the URL hash (/#trips) so refresh, Back/Forward and links work
function useHashPage(): [Page, (page: Page) => void] {
    const [page, setPage] = useState<Page>(pageFromHash);

    useEffect(() => {
        const onHashChange = () => setPage(pageFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    useEffect(() => {
        document.title = `${PAGE_TITLES[page]} · UVT Driver Management`;
    }, [page]);

    const navigate = useCallback((next: Page) => {
        if (window.location.hash.slice(1) === next) return;
        // Assigning the hash pushes a history entry and fires hashchange
        window.location.hash = next;
    }, []);

    return [page, navigate];
}

// Main authenticated app content
function AuthenticatedApp() {
    const [currentPage, setCurrentPage] = useHashPage();
    const [assistantOpen, setAssistantOpen] = useState(false);
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
            case 'service-types':
                return <ServiceTypesPage />;
            case 'vacations':
                return <DriverVacationsPage/>;
            case 'trips':
                return <TripsPage/>;
            case 'bonuses':
                return <BonusesPage />;
            case 'bonus-settings':
                return <BonusSettingsPage />;
            case 'fuel-settings':
                return <FuelSettingsPage />;
            case 'accounting':
                return <AccountingPage />;
            case 'companies':
                return <CompaniesPage />;
            default:
                return <ReportsPage />;
        }
    };

    return (
        <SidebarProvider>
            <StyledSidebar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                assistantOpen={assistantOpen}
                onToggleAssistant={() => setAssistantOpen((open) => !open)}
            />

            <SidebarInset className="flex flex-col overflow-hidden bg-slate-50">
                <HeaderWrapper>
                    <SidebarTrigger className="md:hidden mr-4" />
                    <Header />
                </HeaderWrapper>

                {/* Show banner for view-only users */}
                {!canManage() && <NoPermissionBanner />}

                <main className="flex-1 overflow-y-auto p-8">
                    {renderPage()}
                </main>
            </SidebarInset>

            <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        </SidebarProvider>
    );
}

// Main page component with auth gate
export default function App() {
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
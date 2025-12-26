// app/page.tsx (FINAL CORRECTED VERSION)

"use client";

import React, { useState } from 'react';

// IMPORT ONLY THE NECESSARY STRUCTURAL COMPONENTS AND YOUR STYLED SIDEBAR
// These components (Provider, Inset, Trigger) are assumed to be re-exported 
// from your application's wrapper component file: @/components/Sidebar
import {
    SidebarProvider,
    Sidebar as StyledSidebar, // Rename to avoid conflict with the component definition below
    SidebarInset,
    SidebarTrigger,
} from '@/components/Sidebar'; // <-- Import from your styled wrapper file

// Import all page and header components
import { Header } from '@/components/Header';
import { DriversPage } from '@/components/drivers/DriversPage';
import { VehicleTypesPage } from "@/components/vehicle-types/VehicleTypePage";
import { CarsPage } from "@/components/cars/CarsPage";
import { ReportsPage } from "@/components/reports/ReportsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";

type Page = 'drivers' | 'vehicle-types' | 'cars' | 'reports' | 'settings';

// --- REMOVED SidebarContent ---
// The menu content logic (SidebarContent) is now encapsulated inside
// the StyledSidebar component (in @/components/Sidebar.tsx)

// Helper wrapper to ensure the Header works inside SidebarInset
function HeaderWrapper({ children }: { children: React.ReactNode }) {
    return (
        // This div handles the padding/border and centers the items
        <div className="flex items-center p-4 border-b">
            {children}
        </div>
    );
}

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>('drivers');

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
        // 1. Wrap the entire application in the provider for state management
        <SidebarProvider>

            {/* 2. Use your custom styled Sidebar component */}
            <StyledSidebar currentPage={currentPage} onPageChange={setCurrentPage} />

            {/* 3. SidebarInset wraps the main content area (Header + main) */}
            <SidebarInset className="flex flex-col overflow-hidden bg-slate-50">

                {/* 4. HeaderWrapper contains the mobile trigger */}
                <HeaderWrapper>
                    {/* Trigger is only visible on mobile (small screens) */}
                    <SidebarTrigger className="md:hidden mr-4" />
                    {/* Your standard Header component */}
                    <Header />
                </HeaderWrapper>

                <main className="flex-1 overflow-y-auto p-8">
                    {renderPage()}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
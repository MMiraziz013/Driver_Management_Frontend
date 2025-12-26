import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DriversPage } from '@/components/drivers/DriversPage';
import { VehicleTypesPage } from '@/components/vehicle-types/VehicleTypePage';
import { CarsPage } from '@/components/cars/CarsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';

type Page = 'drivers' | 'vehicle-types' | 'cars' | 'reports' | 'settings';

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
        <div className="flex h-screen bg-slate-50">
            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

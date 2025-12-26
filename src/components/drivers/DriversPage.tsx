import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { getAllDrivers } from '@/services/driverService';
import { DriverCard } from "@/components/drivers/DriverCard";
import { AddDriverModal } from './AddDriverModal';

interface DriverFront {
    id: string;
    fullName: string;
    age: number;
    address: string;
    employmentType: string;
    licenseCategory: string;
    isActive: boolean;
}

export function DriversPage() {
    const [drivers, setDrivers] = useState<DriverFront[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // 1. EXTRACT FETCH LOGIC: Define the function outside useEffect
    // We use useCallback to ensure the function reference doesn't change on every render
    const fetchDriverData = useCallback(async () => {
        // Only set loading to true if we don't have drivers yet (initial load)
        // This prevents the whole screen from flickering during a background refresh
        if (drivers.length === 0) setLoading(true);
        setError(null);

        try {
            const fetchedDrivers: DriverFront[] = await getAllDrivers();
            setDrivers(fetchedDrivers);
        } catch (err) {
            console.error("Error fetching drivers:", err);
            setError("Failed to load driver data from the server.");
        } finally {
            setLoading(false);
        }
    }, [drivers.length]);

    // 2. INITIAL LOAD: Call the function on mount
    useEffect(() => {
        fetchDriverData();
    }, [fetchDriverData]);

    const handleCloseModal = () => setIsAddModalOpen(false);

    // --- State-based Rendering ---

    if (loading) {
        return <div className="p-8 text-lg font-medium text-indigo-600">Loading driver data...</div>;
    }

    if (error && drivers.length === 0) {
        return (
            <div className="p-8 text-red-600 border border-red-300 bg-red-50 rounded-lg">
                <h1 className="text-xl mb-2">Data Load Error</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Drivers ({drivers.length})</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add a Driver
                </button>
            </div>

            {drivers.length === 0 ? (
                <div className="text-center p-12 border border-slate-200 rounded-xl bg-white">
                    <p className="text-xl text-slate-600">No drivers found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drivers.map((driver) => (
                        <DriverCard key={driver.id} driver={driver} />
                    ))}
                </div>
            )}

            {/* 3. CONNECT SUCCESS HANDLER: Pass fetchDriverData to the modal */}
            <AddDriverModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchDriverData}
            />
        </div>
    );
}
import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { getAllDrivers } from '@/services/driverService';
import { DriverCard } from "@/components/drivers/DriverCard";
import { AddDriverModal } from './AddDriverModal';
import { EditDriverModal } from './EditDriverModal';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverFront | null>(null);

    // Fetch logic extracted and memoized
    const fetchDriverData = useCallback(async () => {
        // Only show loading spinner on initial load
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

    // Initial load on mount
    useEffect(() => {
        fetchDriverData();
    }, [fetchDriverData]);

    const handleCloseAddModal = () => setIsAddModalOpen(false);

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedDriver(null);
    };

    const handleEdit = (driver: DriverFront) => {
        setSelectedDriver(driver);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this driver?")) return;

        try {
            const response = await fetch(`http://localhost:5147/api/drivers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh the driver list after successful deletion
                await fetchDriverData();
            } else {
                alert("Failed to delete driver. Please try again.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting driver. Please check your connection.");
        }
    };

    // --- State-based Rendering ---

    if (loading) {
        return (
            <div className="p-8 text-lg font-medium text-indigo-600">
                Loading driver data...
            </div>
        );
    }

    if (error && drivers.length === 0) {
        return (
            <div className="p-8 text-red-600 border border-red-300 bg-red-50 rounded-lg">
                <h1 className="text-xl mb-2">Data Load Error</h1>
                <p>{error}</p>
                <button
                    onClick={fetchDriverData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Drivers ({drivers.length})
                </h1>
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
                    <p className="text-xl text-slate-600 mb-4">No drivers found.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Add Your First Driver
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drivers.map((driver) => (
                        <DriverCard
                            key={driver.id}
                            driver={driver}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Add Driver Modal */}
            <AddDriverModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSuccess={fetchDriverData}
            />

            {/* Edit Driver Modal */}
            <EditDriverModal
                isOpen={isEditModalOpen}
                driver={selectedDriver}
                onClose={handleCloseEditModal}
                onSuccess={fetchDriverData}
            />
        </div>
    );
}
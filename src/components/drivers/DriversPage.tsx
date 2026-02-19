import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { getAllDrivers } from '@/services/driverService';
import { DriverCard } from "@/components/drivers/DriverCard";
import { AddDriverModal } from './AddDriverModal';
import { EditDriverModal } from './EditDriverModal';
import { useAuthFetch, useAuth } from '@/auth/AuthContext';

const API_BASE = 'http://192.168.68.123:8080/api';

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
    const authFetch = useAuthFetch();
    const { token } = useAuth();

    const [drivers, setDrivers] = useState<DriverFront[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverFront | null>(null);

    const fetchDriverData = useCallback(async () => {
        if (drivers.length === 0) setLoading(true);
        setError(null);

        try {
            const fetchedDrivers: DriverFront[] = await getAllDrivers(token!);
            setDrivers(fetchedDrivers);
        } catch (err) {
            console.error("Error fetching drivers:", err);
            setError("Failed to load driver data from the server.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDriverData();
    }, []);

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
            const response = await authFetch(`${API_BASE}/drivers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchDriverData();
            } else {
                alert("Failed to delete driver. Please try again.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting driver. Please check your connection.");
        }
    };

    // Toggle driver active status (activate/deactivate)
    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // The endpoint toggles the status, so we just call it
            const response = await authFetch(`${API_BASE}/drivers/${id}`, {
                method: 'PUT'
            });

            if (response.ok) {
                // Update the local state immediately for better UX
                setDrivers(prevDrivers =>
                    prevDrivers.map(driver =>
                        driver.id === id
                            ? { ...driver, isActive: !driver.isActive }
                            : driver
                    )
                );
            } else {
                const result = await response.json();
                alert(`Failed to ${currentStatus ? 'deactivate' : 'activate'} driver: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Toggle status error:", error);
            alert("Error updating driver status. Please check your connection.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-black font-bold text-lg">Loading drivers...</p>
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

    // Count active/inactive drivers
    const activeCount = drivers.filter(d => d.isActive).length;
    const inactiveCount = drivers.length - activeCount;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Drivers ({drivers.length})
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        <span className="text-green-600 font-medium">{activeCount} active</span>
                        {inactiveCount > 0 && (
                            <span className="text-red-500 font-medium ml-2">• {inactiveCount} inactive</span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchDriverData}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Driver
                    </button>
                </div>
            </div>

            {/* Driver Grid */}
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
                            onToggleStatus={handleToggleStatus}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <AddDriverModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSuccess={fetchDriverData}
            />

            <EditDriverModal
                isOpen={isEditModalOpen}
                driver={selectedDriver}
                onClose={handleCloseEditModal}
                onSuccess={fetchDriverData}
            />
        </div>
    );
}
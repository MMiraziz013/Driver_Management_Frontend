import React, { useEffect, useState } from 'react';
import {
    Plus, Loader2, RefreshCw, CarFront, Trash2, Pencil, ChevronDown, ChevronRight,
    Fuel, Gauge, Droplets, DollarSign, Calendar
} from 'lucide-react';
import { AddCarModal } from './AddCarModal';
import { EditCarModal } from "@/components/cars/EditCarModal";
import { VehicleUnavailablePeriodsModal } from './VehicleUnavailablePeriodsModal';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

// Matching your C# GetVehicleDto
interface Vehicle {
    id: number;
    plateNumber: string;
    model: string | null;
    color: string;
    requiredDriverCategory: string | number;
    vehicleTypeId?: number;
    vehicleTypeName?: string;
    isActive: boolean;
    fuelTankCapacity: number | null;
    fuelConsumptionPer100Km: number | null;
    fuelType: string | null;
    initialFuelLevel: number | null;
    currentMileage: number | null;
    purchaseCostUsd?: number | null;
    planMonths?: number | null;
    activeFrom?: string | null;
}

/**
 * Normalizes the backend response (0, 1, 2, 3 or "B", "C", "D")
 * into a readable "Category X" label.
 */
const getCategoryLabel = (category: string | number) => {
    const val = String(category).trim().toUpperCase();

    const enumMap: Record<string, string> = {
        "1": "B",
        "2": "C",
        "3": "D",
        "0": "B"
    };

    if (enumMap[val]) {
        return `Category ${enumMap[val]}`;
    }

    if (["B", "C", "D"].includes(val)) {
        return `Category ${val}`;
    }

    return `Category ${val}`;
};

/**
 * Assigns colors based on the normalized label
 */
const getCategoryStyles = (category: string | number) => {
    const label = getCategoryLabel(category).toUpperCase();
    if (label.includes('D')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (label.includes('C')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
};

export function CarsPage() {
    const authFetch = useAuthFetch();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [togglingStatus, setTogglingStatus] = useState<Set<number>>(new Set());

    // Unavailable periods modal
    const [unavailableModalVehicle, setUnavailableModalVehicle] = useState<Vehicle | null>(null);

    const toggleRowExpansion = (id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const fetchVehicles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await authFetch(`${API_BASE_URL}/vehicles`);
            const result = await response.json();

            if (response.ok && result.data) {
                setVehicles(result.data);
            } else {
                setError(result.message || 'Failed to retrieve vehicles.');
            }
        } catch (err) {
            setError('Could not connect to the server. Please check if the API is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row expansion

        // Add to toggling set (for loading state)
        setTogglingStatus(prev => new Set(prev).add(id));

        try {
            const response = await authFetch(`${API_BASE_URL}/vehicles/${id}`, {
                method: 'PUT',
            });

            if (response.ok) {
                // Update local state immediately
                setVehicles(prev =>
                    prev.map(v =>
                        v.id === id ? { ...v, isActive: !v.isActive } : v
                    )
                );
            } else {
                alert("Failed to change vehicle status.");
            }
        } catch (err) {
            alert("Connection error.");
        } finally {
            // Remove from toggling set
            setTogglingStatus(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedVehicle(null);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            const response = await authFetch(`${API_BASE_URL}/vehicles/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setVehicles(prev => prev.filter(v => v.id !== id));
            } else {
                alert("Failed to delete vehicle.");
            }
        } catch (err) {
            alert("Connection error.");
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-black font-bold text-lg tracking-tight">Loading Fleet Inventory...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Fleet Inventory ({vehicles.length})</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchVehicles}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Vehicle
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 text-sm font-medium text-red-600 border border-red-200 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-600">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-left font-medium text-slate-600 w-10"></th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Plate Number</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Model</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Color</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {vehicles.map((car, index) => {
                            const isExpanded = expandedRows.has(car.id);
                            const isToggling = togglingStatus.has(car.id);
                            return (
                                <React.Fragment key={car.id}>
                                    {/* Main Row */}
                                    <tr
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/50 transition-colors cursor-pointer`}
                                        onClick={() => toggleRowExpansion(car.id)}
                                    >
                                        <td className="px-4 py-4">
                                            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <CarFront className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-900">{car.plateNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {car.model || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            {car.vehicleTypeName || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-slate-200"
                                                    style={{ backgroundColor: car.color?.toLowerCase().replace(' ', '') || '#gray' }}
                                                />
                                                <span className="capitalize">{car.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryStyles(car.requiredDriverCategory)}`}>
                                                {getCategoryLabel(car.requiredDriverCategory)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {/* Toggle Switch */}
                                            <button
                                                onClick={(e) => handleToggleStatus(car.id, e)}
                                                disabled={isToggling}
                                                className={`
                                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                                    ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                    ${car.isActive ? 'bg-green-500' : 'bg-slate-300'}
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                                                        ${car.isActive ? 'translate-x-6' : 'translate-x-1'}
                                                    `}
                                                />
                                                {isToggling && (
                                                    <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setUnavailableModalVehicle(car)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                                    title="Manage unavailable periods"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(car)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                                    title="Edit vehicle"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(car.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                    title="Delete vehicle"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Details Row */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50">
                                            <td colSpan={8} className="px-4 py-4">
                                                <div className="ml-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Fuel Information */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Fuel className="w-4 h-4 text-indigo-500" />
                                                            <h4 className="font-semibold text-slate-800">Fuel Information</h4>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Fuel Type:</span>
                                                                <span className="font-medium text-slate-800">{car.fuelType || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Tank Capacity:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.fuelTankCapacity ? `${car.fuelTankCapacity} L` : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Initial Fuel:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.initialFuelLevel ? `${car.initialFuelLevel} L` : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Consumption */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Droplets className="w-4 h-4 text-green-500" />
                                                            <h4 className="font-semibold text-slate-800">Consumption</h4>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Per 100km:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.fuelConsumptionPer100Km ? `${car.fuelConsumptionPer100Km} L` : 'N/A'}
                                                                </span>
                                                            </div>
                                                            {car.fuelTankCapacity && car.fuelConsumptionPer100Km && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Est. Range:</span>
                                                                    <span className="font-medium text-slate-800">
                                                                        {Math.round((car.fuelTankCapacity / car.fuelConsumptionPer100Km) * 100)} km
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mileage */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Gauge className="w-4 h-4 text-orange-500" />
                                                            <h4 className="font-semibold text-slate-800">Odometer</h4>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Current Mileage:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.currentMileage ? `${car.currentMileage.toLocaleString()} km` : 'N/A'}
                                                                </span>
                                                            </div>
                                                            {car.activeFrom && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Active From:</span>
                                                                    <span className="font-medium text-slate-800">
                                                                        {new Date(car.activeFrom).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Financial Information */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                                            <h4 className="font-semibold text-slate-800">Financial</h4>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Purchase Cost:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.purchaseCostUsd ? `$${car.purchaseCostUsd.toLocaleString()}` : 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">Plan Months:</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {car.planMonths || 13}
                                                                </span>
                                                            </div>
                                                            {car.purchaseCostUsd && car.planMonths && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">Monthly Plan:</span>
                                                                    <span className="font-medium text-emerald-600">
                                                                        ${(car.purchaseCostUsd / car.planMonths).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>

                    {vehicles.length === 0 && !isLoading && (
                        <div className="p-12 text-center text-slate-500">
                            No vehicles found in inventory.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            <AddCarModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchVehicles}
            />

            {/* Edit Modal */}
            <EditCarModal
                isOpen={isEditModalOpen}
                vehicle={selectedVehicle}
                onClose={handleCloseEditModal}
                onSuccess={fetchVehicles}
            />

            {/* Unavailable Periods Modal */}
            {unavailableModalVehicle && (
                <VehicleUnavailablePeriodsModal
                    isOpen={!!unavailableModalVehicle}
                    vehicleId={unavailableModalVehicle.id}
                    vehiclePlate={unavailableModalVehicle.plateNumber}
                    onClose={() => setUnavailableModalVehicle(null)}
                />
            )}
        </div>
    );
}
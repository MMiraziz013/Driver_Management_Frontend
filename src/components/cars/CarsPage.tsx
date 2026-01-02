import React, { useEffect, useState } from 'react';
import { Plus, Loader2, RefreshCw, CarFront, Trash2 } from 'lucide-react';
import { AddCarModal } from './AddCarModal';

// Matching your C# GetVehicleDto
interface Vehicle {
    id: number;
    plateNumber: string;
    model: string | null;
    color: string;
    requiredDriverCategory: string | number;
}

/**
 * Normalizes the backend response (0, 1, 2, 3 or "B", "C", "D")
 * into a readable "Category X" label.
 */
const getCategoryLabel = (category: string | number) => {
    const val = String(category).trim().toUpperCase();

    // Map the C# Enum Integer Values (1=B, 2=C, 3=D)
    // Also handling "0" if your DB has a fallback value
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
    return 'bg-slate-50 text-slate-700 border-slate-200'; // Default for B
};

export function CarsPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_URL = 'http://localhost:5147/api/vehicles';

    const fetchVehicles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(API_URL);
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

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            // Using Query String format to match your Swagger/Backend logic
            const response = await fetch(`${API_URL}?id=${id}`, {
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
            {/* Header - Unified with VehicleTypes style */}
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
                        onClick={() => setIsModalOpen(true)}
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

            {/* Table - Unified style */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-600">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-left font-medium text-slate-600">Plate Number</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-600">Model</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-600">Color</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-600">Category</th>
                            <th className="px-6 py-3 text-right font-medium text-slate-600">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {vehicles.map((car, index) => (
                            <tr
                                key={car.id}
                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/50 transition-colors`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <CarFront className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">{car.plateNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {car.model || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full border border-slate-200"
                                            style={{ backgroundColor: car.color.toLowerCase().replace(' ', '') }}
                                        />
                                        <span className="capitalize">{car.color}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryStyles(car.requiredDriverCategory)}`}>
                                            {getCategoryLabel(car.requiredDriverCategory)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(car.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {vehicles.length === 0 && !isLoading && (
                        <div className="p-12 text-center text-slate-500">
                            No vehicles found in inventory.
                        </div>
                    )}
                </div>
            </div>

            <AddCarModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchVehicles}
            />
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Import the service and modal
import { getAllVehicleTypes } from '@/services/vehicleTypeService';
import { AddVehicleTypeModal } from './AddVehicleTypeModal'; // Assuming modal is in the same directory

// Define the interface that matches the service response
interface VehicleType {
    id: string;
    name: string;
    description: string;
}

// Mock data for initial structure (will be replaced by fetched data)
const mockVehicleTypes: VehicleType[] = [
    { id: '1', name: 'Sedan', description: 'Standard passenger car.' },
    { id: '2', name: 'SUV', description: 'Sport Utility Vehicle, great for families.' },
    { id: '3', name: 'Heavy Truck', description: 'Used for large freight and long-haul operations.' },
];


export function VehicleTypesPage() {
    // State for data fetching
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for modal visibility
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const handleCloseModal = () => setIsAddModalOpen(false);


    // Data Fetching Logic (useEffect)
    useEffect(() => {
        const fetchVehicleTypeData = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedTypes = await getAllVehicleTypes();
                setVehicleTypes(fetchedTypes);
            } catch (err) {
                console.error("Error fetching vehicle types:", err);
                setError("Failed to load vehicle types from the server.");
            } finally {
                setLoading(false);
            }
        };
        // Use mock data temporarily if API connection is not ready
        // setVehicleTypes(mockVehicleTypes);
        // setLoading(false);

        fetchVehicleTypeData();
    }, []);

    // --- Conditional Rendering ---

    if (loading) {
        return <div className="p-8 text-lg font-medium text-indigo-600">Loading vehicle types...</div>;
    }

    if (error) {
        return <div className="p-8 text-lg font-medium text-red-600 border border-red-300 bg-red-50 rounded-lg">{error}</div>;
    }

    // --- Main Content Rendering ---
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Vehicle Types ({vehicleTypes.length})</h1>
                <button
                    // Connect button to open the modal
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Vehicle Type
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vehicleTypes.map((type, index) => (
                            <tr
                                key={type.id}
                                className={`border-b border-slate-200 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                } hover:bg-slate-100/50 transition-colors`}
                            >
                                <td className="px-6 py-4 text-slate-900 font-medium">{type.name}</td>
                                <td className="px-6 py-4 text-slate-600">{type.description}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {vehicleTypes.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No vehicle types found.
                        </div>
                    )}
                </div>
            </div>

            {/* Render the modal, controlled by state */}
            <AddVehicleTypeModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}
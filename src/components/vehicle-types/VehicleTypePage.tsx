import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';

import { getAllVehicleTypes, updateVehicleType } from '@/services/vehicleTypeService';
import { AddVehicleTypeModal } from './AddVehicleTypeModal';
import { useAuth } from "@/auth/AuthContext";

interface VehicleType {
    id: string;  // Keep as string to match service
    name: string;
    description: string;
}

export function VehicleTypesPage() {
    const { token } = useAuth();

    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const handleCloseModal = () => setIsAddModalOpen(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchVehicleTypeData = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedTypes = await getAllVehicleTypes(token!);
            setVehicleTypes(fetchedTypes);
        } catch (err) {
            console.error("Error fetching vehicle types:", err);
            setError("Failed to load vehicle types from the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicleTypeData();
    }, []);

    const handleStartEdit = (vt: VehicleType) => {
        setEditingId(vt.id);
        setEditName(vt.name);
        setEditDescription(vt.description || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editName.trim()) return;

        setSaving(true);
        setError(null);

        try {
            await updateVehicleType(token!, Number(editingId), {  // Convert to number for API
                name: editName.trim(),
                description: editDescription.trim() || undefined,
            });

            setSuccess('Vehicle type updated successfully');
            setTimeout(() => setSuccess(null), 3000);

            handleCancelEdit();
            await fetchVehicleTypeData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update vehicle type');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-lg font-medium text-indigo-600">Loading vehicle types...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Vehicle Types ({vehicleTypes.length})</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Vehicle Type
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 w-16">ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Description</th>
                            <th className="px-6 py-3 text-center text-sm font-medium text-slate-600 w-32">Actions</th>
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
                                <td className="px-6 py-4 text-slate-500">{type.id}</td>
                                <td className="px-6 py-4">
                                    {editingId === type.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-900">{type.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === type.id ? (
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Description (optional)"
                                        />
                                    ) : (
                                        <span className="text-slate-600">{type.description || '-'}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        {editingId === type.id ? (
                                            <>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={saving || !editName.trim()}
                                                    className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Save"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={saving}
                                                    className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleStartEdit(type)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
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

            <AddVehicleTypeModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    handleCloseModal();
                    fetchVehicleTypeData(); // Refresh after adding
                }}
            />
        </div>
    );
}
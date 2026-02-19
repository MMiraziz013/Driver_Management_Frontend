import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tags, RefreshCw } from 'lucide-react';
import { AddServiceTypeModal } from './AddServiceTypeModal';
import { EditServiceTypeModal } from './EditServiceTypeModal';
import { useAuthFetch } from '@/auth/AuthContext';

interface ServiceType {
    id: number;
    name: string;
    description: string | null;
}

const API_BASE = "http://192.168.68.123:8080/api";

export function ServiceTypesPage() {
    const authFetch = useAuthFetch();

    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchServiceTypes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authFetch(`${API_BASE}/service-type`);
            if (!response.ok) {
                throw new Error('Failed to fetch service types');
            }
            const result = await response.json();
            setServiceTypes(result.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching service types:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServiceTypes();
    }, []);

    const handleEdit = (serviceType: ServiceType) => {
        setSelectedServiceType(serviceType);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const response = await authFetch(`${API_BASE}/service-type?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchServiceTypes();
                setDeleteId(null);
            } else {
                const errData = await response.json();
                alert(`Failed to delete: ${errData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting service type:', error);
            alert('Error deleting service type. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchServiceTypes}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Tags className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Service Types</h1>
                        <p className="text-sm text-slate-500">Manage vehicle service categories</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchServiceTypes}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Service Type
                    </button>
                </div>
            </div>

            {/* Service Types Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {serviceTypes.length === 0 ? (
                    <div className="p-12 text-center">
                        <Tags className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No service types yet</h3>
                        <p className="text-slate-500 mb-4">Get started by adding your first service type.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Service Type
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {serviceTypes.map((serviceType) => (
                            <tr key={serviceType.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-600">
                                            #{serviceType.id}
                                        </span>
                                </td>
                                <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-slate-900">
                                            {serviceType.name}
                                        </span>
                                </td>
                                <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600">
                                            {serviceType.description || '—'}
                                        </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(serviceType)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(serviceType.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Service Type</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to delete this service type? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddServiceTypeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchServiceTypes}
            />

            <EditServiceTypeModal
                isOpen={isEditModalOpen}
                serviceType={selectedServiceType}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedServiceType(null);
                }}
                onSuccess={fetchServiceTypes}
            />
        </div>
    );
}
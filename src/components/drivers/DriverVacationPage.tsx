'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Plus,
    RefreshCw,
    Loader2,
    Pencil,
    Trash2,
    User,
    CalendarDays,
    Clock,
    CheckCircle,
    AlertCircle,
    CalendarOff
} from 'lucide-react';
import { useAuth, useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { AddVacationModal } from './AddVacationModal';
import { EditVacationModal } from './EditVacationModal';

interface DriverVacation {
    id: number;
    driverId: number;
    driverName: string;
    startDate: string;
    endDate: string;
    notes: string | null;
    isActive: boolean;
    isPast: boolean;
    isFuture: boolean;
}

interface Driver {
    id: number;
    fullName: string;
    isActive: boolean;
}

type FilterType = 'all' | 'active' | 'upcoming' | 'past';

export function DriverVacationsPage() {
    const authFetch = useAuthFetch();
    const { canManage } = useAuth();

    const [vacations, setVacations] = useState<DriverVacation[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedVacation, setSelectedVacation] = useState<DriverVacation | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchVacations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await authFetch(`${API_BASE_URL}/driver-vacations`);
            const data = await response.json();

            if (response.ok && data.data) {
                setVacations(data.data);
            } else {
                setError(data.message || 'Failed to load vacations');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
            console.error('Fetch vacations error:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    const fetchDrivers = useCallback(async () => {
        try {
            const response = await authFetch(`${API_BASE_URL}/drivers?PageSize=100`);
            const data = await response.json();

            if (response.ok && data.data) {
                setDrivers(data.data.filter((d: Driver) => d.isActive));
            }
        } catch (err) {
            console.error('Fetch drivers error:', err);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchVacations();
        fetchDrivers();
    }, [fetchVacations, fetchDrivers]);

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const response = await authFetch(`${API_BASE_URL}/driver-vacations/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setVacations(prev => prev.filter(v => v.id !== id));
                setDeleteConfirmId(null);
            } else {
                const data = await response.json();
                alert(`Failed to delete: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting vacation. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (vacation: DriverVacation) => {
        setSelectedVacation(vacation);
        setShowEditModal(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
        }
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    const getDaysCount = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const getStatusBadge = (vacation: DriverVacation) => {
        if (vacation.isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    On Vacation
                </span>
            );
        }
        if (vacation.isFuture) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />
                    Upcoming
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <CalendarOff className="w-3.5 h-3.5" />
                Completed
            </span>
        );
    };

    const filteredVacations = vacations.filter(v => {
        switch (filter) {
            case 'active': return v.isActive;
            case 'upcoming': return v.isFuture;
            case 'past': return v.isPast;
            default: return true;
        }
    });

    const stats = {
        total: vacations.length,
        active: vacations.filter(v => v.isActive).length,
        upcoming: vacations.filter(v => v.isFuture).length,
        past: vacations.filter(v => v.isPast).length
    };

    if (loading && vacations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading vacations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Driver Vacations</h1>
                        <p className="text-sm text-gray-500">Manage driver leave and vacation schedules</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchVacations}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {canManage() && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Add Vacation
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setFilter('all')}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                        filter === 'all' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Vacations</div>
                </div>
                <div
                    onClick={() => setFilter('active')}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                        filter === 'active' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-sm text-gray-500">Currently Active</div>
                </div>
                <div
                    onClick={() => setFilter('upcoming')}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                        filter === 'upcoming' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
                    <div className="text-sm text-gray-500">Upcoming</div>
                </div>
                <div
                    onClick={() => setFilter('past')}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                        filter === 'past' ? 'border-gray-500 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="text-2xl font-bold text-gray-600">{stats.past}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                    <button
                        onClick={fetchVacations}
                        className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Vacations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredVacations.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {filter === 'all' ? 'No vacations scheduled' : `No ${filter} vacations`}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {filter === 'all'
                                ? 'Add vacation periods to keep track of driver availability.'
                                : 'Try selecting a different filter to see more results.'}
                        </p>
                        {canManage() && filter === 'all' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Vacation
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Driver
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Period
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Duration
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Notes
                            </th>
                            {canManage() && (
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filteredVacations.map((vacation) => (
                            <tr
                                key={vacation.id}
                                className={`hover:bg-gray-50 transition-colors ${
                                    vacation.isActive ? 'bg-green-50/30' : ''
                                }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="font-medium text-gray-900">
                                                {vacation.driverName}
                                            </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CalendarDays className="w-4 h-4 text-gray-400" />
                                        {formatDateRange(vacation.startDate, vacation.endDate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                        <span className="text-gray-600">
                                            {getDaysCount(vacation.startDate, vacation.endDate)} days
                                        </span>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(vacation)}
                                </td>
                                <td className="px-6 py-4">
                                        <span className="text-gray-500 text-sm truncate max-w-xs block">
                                            {vacation.notes || '—'}
                                        </span>
                                </td>
                                {canManage() && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(vacation)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(vacation.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Vacation</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this vacation period? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
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

            {/* Add Modal */}
            <AddVacationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchVacations();
                    setShowAddModal(false);
                }}
                drivers={drivers}
            />

            {/* Edit Modal */}
            <EditVacationModal
                isOpen={showEditModal}
                vacation={selectedVacation}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedVacation(null);
                }}
                onSuccess={() => {
                    fetchVacations();
                    setShowEditModal(false);
                    setSelectedVacation(null);
                }}
            />
        </div>
    );
}
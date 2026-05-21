import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Calendar, AlertTriangle, Wrench, Pencil } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import {
    VehicleUnavailablePeriod,
    getVehicleUnavailablePeriods,
    createVehicleUnavailablePeriod,
    updateVehicleUnavailablePeriod,
    deleteVehicleUnavailablePeriod
} from '@/services/vehicleAvailablityService';

interface Props {
    isOpen: boolean;
    vehicleId: number;
    vehiclePlate: string;
    onClose: () => void;
}

const COMMON_REASONS = [
    'Accident / Collision',
    'Scheduled Maintenance',
    'Insurance Expired',
    'Registration Expired',
    'Mechanical Failure',
    'Tire Replacement',
    'Body Repair',
    'Engine Repair',
    'Transmission Issue',
    'Electrical Problem',
    'Other'
];

export function VehicleUnavailablePeriodsModal({ isOpen, vehicleId, vehiclePlate, onClose }: Props) {
    const authFetch = useAuthFetch();

    const [periods, setPeriods] = useState<VehicleUnavailablePeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<VehicleUnavailablePeriod | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const fetchPeriods = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getVehicleUnavailablePeriods(authFetch, vehicleId);
            setPeriods(data);
        } catch (err) {
            setError('Failed to load unavailable periods');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPeriods();
            resetForm();
        }
    }, [isOpen, vehicleId]);

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setReason('');
        setNotes('');
        setShowForm(false);
        setEditingPeriod(null);
    };

    const openEditForm = (period: VehicleUnavailablePeriod) => {
        setEditingPeriod(period);
        setStartDate(new Date(period.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(period.endDate).toISOString().split('T')[0]);
        setReason(period.reason || '');
        setNotes(period.notes || '');
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (editingPeriod) {
                // Update existing
                await updateVehicleUnavailablePeriod(authFetch, {
                    id: editingPeriod.id,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    reason: reason || undefined,
                    notes: notes || undefined
                });
            } else {
                // Create new
                await createVehicleUnavailablePeriod(authFetch, {
                    vehicleId,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    reason: reason || undefined,
                    notes: notes || undefined
                });
            }

            await fetchPeriods();
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Failed to save unavailable period');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this unavailable period?')) return;

        try {
            await deleteVehicleUnavailablePeriod(authFetch, id);
            setPeriods(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setError('Failed to delete period');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDayCount = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const isPeriodActive = (period: VehicleUnavailablePeriod) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        return start <= today && end >= today;
    };

    const isPeriodFuture = (period: VehicleUnavailablePeriod) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(period.startDate) > today;
    };

    const isPeriodPast = (period: VehicleUnavailablePeriod) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(period.endDate) < today;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Unavailable Periods</h2>
                        <p className="text-sm text-slate-500 mt-1">Vehicle: <span className="font-medium text-slate-700">{vehiclePlate}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Add New Period Button */}
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Unavailable Period
                        </button>
                    )}

                    {/* Add/Edit Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4">
                                {editingPeriod ? 'Edit Unavailable Period' : 'New Unavailable Period'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {startDate && endDate && (
                                <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
                                    Duration: <span className="font-medium">{getDayCount(startDate, endDate)} day(s)</span>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reason
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Select reason...</option>
                                    {COMMON_REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Additional details (repair shop, estimated cost, etc.)..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !startDate || !endDate}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : editingPeriod ? (
                                        <Pencil className="w-4 h-4" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    {editingPeriod ? 'Update Period' : 'Add Period'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Periods List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : periods.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No unavailable periods configured</p>
                            <p className="text-sm mt-1">Vehicle is available for all dates</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Active periods first, then future, then past */}
                            {periods
                                .sort((a, b) => {
                                    const aActive = isPeriodActive(a);
                                    const bActive = isPeriodActive(b);
                                    const aFuture = isPeriodFuture(a);
                                    const bFuture = isPeriodFuture(b);

                                    if (aActive && !bActive) return -1;
                                    if (!aActive && bActive) return 1;
                                    if (aFuture && !bFuture) return -1;
                                    if (!aFuture && bFuture) return 1;

                                    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                                })
                                .map(period => {
                                    const isActive = isPeriodActive(period);
                                    const isFuture = isPeriodFuture(period);
                                    const isPast = isPeriodPast(period);

                                    return (
                                        <div
                                            key={period.id}
                                            className={`p-4 rounded-lg border transition-all ${
                                                isActive
                                                    ? 'bg-red-50 border-red-200'
                                                    : isFuture
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-slate-50 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        isActive
                                                            ? 'bg-red-100'
                                                            : isFuture
                                                                ? 'bg-amber-100'
                                                                : 'bg-slate-100'
                                                    }`}>
                                                        <Wrench className={`w-5 h-5 ${
                                                            isActive
                                                                ? 'text-red-600'
                                                                : isFuture
                                                                    ? 'text-amber-600'
                                                                    : 'text-slate-400'
                                                        }`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-slate-900">
                                                                {formatDate(period.startDate)} — {formatDate(period.endDate)}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                ({getDayCount(period.startDate, period.endDate)} days)
                                                            </span>
                                                            {isActive && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-red-600 text-white rounded-full">
                                                                    Currently Unavailable
                                                                </span>
                                                            )}
                                                            {isFuture && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-600 text-white rounded-full">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                            {isPast && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-slate-400 text-white rounded-full">
                                                                    Past
                                                                </span>
                                                            )}
                                                        </div>
                                                        {period.reason && (
                                                            <p className="text-sm text-slate-600 mt-1 font-medium">{period.reason}</p>
                                                        )}
                                                        {period.notes && (
                                                            <p className="text-sm text-slate-500 mt-1">{period.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditForm(period)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit period"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(period.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete period"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                Active
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                Upcoming
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                Past
                            </span>
                        </div>
                        <span>{periods.length} period(s) total</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
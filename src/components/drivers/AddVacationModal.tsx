'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, AlertCircle, User } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface Driver {
    id: number;
    fullName: string;
    isActive: boolean;
}

interface AddVacationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    drivers: Driver[];
    preselectedDriverId?: number;
}

export function AddVacationModal({
                                     isOpen,
                                     onClose,
                                     onSuccess,
                                     drivers,
                                     preselectedDriverId
                                 }: AddVacationModalProps) {
    const authFetch = useAuthFetch();

    const [driverId, setDriverId] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDriverId(preselectedDriverId?.toString() || '');
            setStartDate('');
            setEndDate('');
            setNotes('');
            setError(null);
        }
    }, [isOpen, preselectedDriverId]);

    // Auto-set end date when start date changes
    useEffect(() => {
        if (startDate && !endDate) {
            // Default to 7 days vacation
            const start = new Date(startDate);
            start.setDate(start.getDate() + 6);
            setEndDate(start.toISOString().split('T')[0]);
        }
    }, [startDate, endDate]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!driverId) {
            setError('Please select a driver');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setError('End date cannot be before start date');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authFetch(`${API_BASE_URL}/driver-vacations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: parseInt(driverId),
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    notes: notes.trim() || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                onSuccess();
            } else {
                setError(data.message || 'Failed to create vacation');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Create vacation error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const getDaysCount = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
        return 0;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Add Vacation</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Driver Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Driver <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={driverId}
                                onChange={(e) => setDriverId(e.target.value)}
                                disabled={!!preselectedDriverId}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white disabled:bg-gray-50"
                                required
                            >
                                <option value="">Select a driver...</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
                                required
                            />
                        </div>
                    </div>

                    {/* Duration Display */}
                    {getDaysCount() > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                            <strong>Duration:</strong> {getDaysCount()} day{getDaysCount() !== 1 ? 's' : ''}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 resize-none"
                            placeholder="e.g., Annual leave, Medical leave, etc."
                        />
                    </div>

                    {/* Info Box */}
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                        <strong>Note:</strong> The driver will be automatically excluded from trip assignments during this vacation period.
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Vacation'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
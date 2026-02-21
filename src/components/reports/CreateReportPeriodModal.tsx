import React, { useState } from 'react';
import { X, Loader2, AlertCircle, Calendar } from 'lucide-react';
import {useAuthFetch} from "@/auth/AuthContext";
import { API_BASE_URL } from '@/config/api';

interface CreateReportPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateReportPeriodModal({ isOpen, onClose, onSuccess }: CreateReportPeriodModalProps) {
    const authFetch = useAuthFetch();
    
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !startDate || !endDate) {
            setError("Please fill in all fields.");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date cannot be after end date.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Build query string for the API
            const params = new URLSearchParams({
                description: description.trim(),
                startDate: startDate,
                endDate: endDate
            });

            const response = await authFetch(`${API_BASE_URL}/report-periods?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Reset form
                setDescription('');
                setStartDate('');
                setEndDate('');
                onSuccess();
            } else {
                setError(result.message || "Failed to create report period.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setDescription('');
        setStartDate('');
        setEndDate('');
        setError(null);
        onClose();
    };

    // Auto-generate description based on dates
    const generateDescription = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

            if (start.getMonth() === end.getMonth()) {
                return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
            } else {
                return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
            }
        }
        return '';
    };

    // When dates change, suggest a description if empty
    const handleDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartDate(value);
            // Auto-set end date to 14 days later if not set
            if (!endDate && value) {
                const start = new Date(value);
                start.setDate(start.getDate() + 14);
                setEndDate(start.toISOString().split('T')[0]);
            }
        } else {
            setEndDate(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">New Report Period</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                                min={startDate}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={generateDescription() || "e.g., January 1-15, 2025"}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-white placeholder:text-gray-400"
                            required
                        />
                        {generateDescription() && !description && (
                            <button
                                type="button"
                                onClick={() => setDescription(generateDescription())}
                                className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
                            >
                                Use suggested: "{generateDescription()}"
                            </button>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                        <strong>Tip:</strong> Report periods are typically 15-day intervals.
                        After creating a period, you can upload trip data and run the assignment engine.
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !description || !startDate || !endDate}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Period'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
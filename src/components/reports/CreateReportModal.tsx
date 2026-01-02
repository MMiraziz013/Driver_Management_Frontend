import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';

interface CreateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Added to trigger a refresh on the main page
}

export function CreateReportModal({ isOpen, onClose, onSuccess }: CreateReportModalProps) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periods, setPeriods] = useState<{
        id: number;
        startDate: string;
        endDate: string;
        description: string;
    }[]>([]);    
    const [error, setError] = useState<string | null>(null);
    // Helper to make the dates look nice in the dropdown
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Fetch existing periods so user can select where to upload
    useEffect(() => {
        if (isOpen) {
            fetch('http://localhost:5147/api/report-periods')
                .then(res => res.json())
                .then(result => setPeriods(result.data || []))
                .catch(() => setError("Failed to load report periods."));
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedPeriodId) return;

        setIsSubmitting(true);
        setError(null);

        // Prepare Multi-part form data
        const formData = new FormData();
        formData.append('file', file); // 'file' must match the parameter name in C#

        try {
            const response = await fetch(`https://localhost:5001/api/reports/upload/${selectedPeriodId}`, {
                method: 'POST',
                body: formData,
                // Note: Don't set Content-Type header manually, 
                // the browser will set it with the correct boundary.
            });

            const result = await response.json();

            if (response.ok) {
                onSuccess(); // Refresh the list
                onClose();
                setFile(null);
                setSelectedPeriodId('');
            } else {
                setError(result.message || "Upload failed.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Upload Report Data</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select Report Period
                        </label>
                        <select
                            value={selectedPeriodId}
                            onChange={(e) => setSelectedPeriodId(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-black bg-white"
                            required
                        >
                            <option value="">Choose a date range...</option>
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {/* Now displaying: Oct 1, 2025 - Oct 15, 2025 (Description) */}
                                    {formatDate(p.startDate)} — {formatDate(p.endDate)} ({p.description})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Excel/CSV File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                required
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                    file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                                    <Upload className={`w-6 h-6 ${file ? 'text-indigo-600' : 'text-slate-400'}`} />
                                </div>
                                <span className="text-sm font-medium text-slate-600 text-center">
                                    {file ? file.name : 'Click to select Excel file'}
                                </span>
                                <span className="text-xs text-slate-400">Max size 10MB</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !file || !selectedPeriodId}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload & Process'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface CreateReportModalProps {
    isOpen: boolean;    
    onClose: () => void;
}

export function CreateReportModal({ isOpen, onClose }: CreateReportModalProps) {
    const [reportType, setReportType] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Report Type:', reportType);
        console.log('File:', fileName);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-slate-900">Create a Report</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-slate-700 mb-2">
                            Report Type
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a report type</option>
                            <option value="driver-auto-hours">Driver Auto-Hours</option>
                            <option value="driver-auto-appoint">Driver Auto-Appoint</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Upload Excel File
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
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                            >
                                <Upload className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-600">
                  {fileName || 'Click to upload file'}
                </span>
                            </label>
                        </div>
                        {fileName && (
                            <p className="mt-2 text-sm text-slate-500">
                                Selected: {fileName}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Create Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

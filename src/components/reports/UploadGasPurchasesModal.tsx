import React, { useState } from 'react';
import { X, Upload, Loader2, AlertCircle, FileSpreadsheet, CheckCircle, Fuel } from 'lucide-react';
import {useAuthFetch} from "@/auth/AuthContext";
import { API_BASE_URL } from '@/config/api';


interface ReportPeriod {
    id: number;
    startDate: string;
    endDate: string;
    description: string;
    status: string;
}

interface UploadGasPurchasesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    periodId: number | null;
    periods: ReportPeriod[];
}

export function UploadGasPurchasesModal({ isOpen, onClose, onSuccess, periodId, periods }: UploadGasPurchasesModalProps) {
    const authFetch = useAuthFetch();
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periodId?.toString() || '');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<{
        success: boolean;
        message: string;
        purchasesImported?: number;
        totalLiters?: number;
        totalAmount?: number;
    } | null>(null);

    // Update selected period when periodId prop changes
    React.useEffect(() => {
        if (periodId) {
            setSelectedPeriodId(periodId.toString());
        }
    }, [periodId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const hasValidExtension = validExtensions.some(ext =>
                selectedFile.name.toLowerCase().endsWith(ext)
            );

            if (!hasValidExtension) {
                setError("Please select a valid Excel or CSV file.");
                return;
            }

            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB.");
                return;
            }

            setFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !selectedPeriodId) {
            setError("Please select a period and file.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await authFetch(`${API_BASE_URL}/gas/purchases/upload/${selectedPeriodId}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setUploadResult({
                    success: true,
                    message: result.message || "Gas purchases uploaded successfully!",
                    purchasesImported: result.data?.purchasesImported || result.data?.count,
                    totalLiters: result.data?.totalLiters,
                    totalAmount: result.data?.totalAmount
                });

                setFile(null);
                const fileInput = document.getElementById('gas-file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setError(result.message || "Upload failed. Please check your file format.");
            }
        } catch (err) {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setUploadResult(null);
        if (!periodId) {
            setSelectedPeriodId('');
        }
        onClose();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const fakeEvent = {
                target: { files: [droppedFile] }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(fakeEvent);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Fuel className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Gas Purchases</h2>
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
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {uploadResult?.success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{uploadResult.message}</span>
                            </div>
                            {(uploadResult.purchasesImported || uploadResult.totalLiters) && (
                                <div className="text-xs mt-1 ml-6 space-y-0.5">
                                    {uploadResult.purchasesImported && (
                                        <div>{uploadResult.purchasesImported} purchases imported</div>
                                    )}
                                    {uploadResult.totalLiters && (
                                        <div>{uploadResult.totalLiters.toFixed(1)} liters total</div>
                                    )}
                                    {uploadResult.totalAmount && (
                                        <div>{uploadResult.totalAmount.toLocaleString()} UZS</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Period Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Report Period
                        </label>
                        <select
                            value={selectedPeriodId}
                            onChange={(e) => setSelectedPeriodId(e.target.value)}
                            disabled={!!periodId}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                            required
                        >
                            <option value="">Choose a period...</option>
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {formatDate(p.startDate)} — {formatDate(p.endDate)} ({p.description})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gas Purchase Report (Excel/CSV)
                        </label>
                        <div
                            className="relative"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="gas-file-upload"
                                required={!uploadResult?.success}
                            />
                            <label
                                htmlFor="gas-file-upload"
                                className={`flex flex-col items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                    file
                                        ? 'border-amber-400 bg-amber-50/30'
                                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-3 rounded-full shadow-sm border ${
                                    file
                                        ? 'bg-amber-50 border-amber-100'
                                        : 'bg-white border-gray-100'
                                }`}>
                                    {file ? (
                                        <FileSpreadsheet className="w-6 h-6 text-amber-600" />
                                    ) : (
                                        <Upload className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>

                                {file ? (
                                    <div className="text-center">
                                        <span className="text-sm font-medium text-gray-900">
                                            {file.name}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-sm font-medium text-gray-600">
                                            Drop file here or click to browse
                                        </span>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            Supports .xlsx, .xls, .csv (max 10MB)
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Expected format info */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                        <strong>Expected columns:</strong>
                        <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
                            <li>Date (дата покупки)</li>
                            <li>Liters / Gas amount (литры)</li>
                            <li>Fuel Type: АИ-92, АИ-95, or ДТ</li>
                            <li>Amount in UZS (сумма)</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
                        <strong>Note:</strong> Uploading a new file will replace existing gas purchase data for this period.
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            {uploadResult?.success ? 'Close' : 'Cancel'}
                        </button>
                        {!uploadResult?.success && (
                            <button
                                type="submit"
                                disabled={isSubmitting || !file || !selectedPeriodId}
                                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Gas Report
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
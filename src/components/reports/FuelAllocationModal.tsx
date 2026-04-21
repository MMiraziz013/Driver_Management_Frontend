import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Fuel, Download, CheckCircle, AlertTriangle, Car } from 'lucide-react';
import {useAuthFetch} from "@/auth/AuthContext";
import { API_BASE_URL } from '@/config/api';

interface VehicleFuelStatus {
    vehicleId: number;
    plateNumber: string;
    model?: string;
    fuelType: string;
    tankCapacity: number;
    consumptionPer100Km: number;
    initialFuelLevel: number;
    totalDistanceDriven: number;
    fuelConsumed: number;
    fuelAllocated: number;
    currentFuelLevel: number;
    totalFuelCostUzs: number;
    status: string;
    warnings: string[];
}

interface FuelAllocationResult {
    reportPeriodId: number;
    calculatedAt: string;
    success: boolean;
    totalDistanceDriven: number;
    totalFuelConsumed: number;
    totalFuelPurchased: number;
    totalFuelAllocated: number;
    unallocatedFuel: number;
    totalCostUzs: number;
    vehicleStatuses: VehicleFuelStatus[];
    vehiclesWithIssues: number;
    vehiclesOk: number;
    warnings: string[];
    errors: string[];
}

interface FuelAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    periodId: number;
}

export function FuelAllocationModal({ isOpen, onClose, periodId }: FuelAllocationModalProps) {
    const authFetch = useAuthFetch();
    const [isLoading, setIsLoading] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FuelAllocationResult | null>(null);

    // Fetch existing allocation data when modal opens
    useEffect(() => {
        if (isOpen && periodId) {
            fetchAllocationData();
        }
    }, [isOpen, periodId]);

    const fetchAllocationData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE_URL}/fuel/status/${periodId}`);

            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    setResult(data.data);
                }
            } else if (response.status !== 404) {
                // 404 is expected if no allocation has been run yet
                const data = await response.json();
                setError(data.message || "Failed to load fuel data.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunAllocation = async () => {
        setIsRunning(true);
        setError(null);

        try {
            const response = await authFetch(`${API_BASE_URL}/fuel/allocate/${periodId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok && data.data) {
                setResult(data.data);
            } else {
                setError(data.message || "Allocation failed.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsRunning(false);
        }
    };

    const handleDownloadReport = async () => {
        try {
            const response = await authFetch(`${API_BASE_URL}/fuel/export/${periodId}`);

            if (!response.ok) {
                alert("Export failed. Please run allocation first.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Fuel_Report_Period_${periodId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            alert("Download failed.");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OK':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'LOW':
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'NEGATIVE':
            case 'DEFICIT':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'OK':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'LOW':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'NEGATIVE':
            case 'DEFICIT':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatNumber = (num: number, decimals: number = 1) => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const formatCurrency = (num: number) => {
        return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Fuel className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Fuel Allocation</h2>
                            <p className="text-sm text-gray-500">Period #{periodId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                            <p className="text-gray-500">Loading fuel data...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 mb-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* No Data State */}
                    {!isLoading && !result && !error && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Fuel className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Allocation Data</h3>
                            <p className="text-gray-500 mb-6">
                                Run the fuel allocation engine to calculate fuel distribution for this period.
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-sm text-blue-600 font-medium">Total Distance</div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {formatNumber(result.totalDistanceDriven, 0)} km
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="text-sm text-amber-600 font-medium">Fuel Consumed</div>
                                    <div className="text-2xl font-bold text-amber-900">
                                        {formatNumber(result.totalFuelConsumed)} L
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-4">
                                    <div className="text-sm text-emerald-600 font-medium">Fuel Allocated</div>
                                    <div className="text-2xl font-bold text-emerald-900">
                                        {formatNumber(result.totalFuelAllocated)} L
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="text-sm text-purple-600 font-medium">Total Cost</div>
                                    <div className="text-2xl font-bold text-purple-900">
                                        {formatCurrency(result.totalCostUzs)} UZS
                                    </div>
                                </div>
                            </div>

                            {/* Status Summary */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium text-gray-700">{result.vehiclesOk} OK</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-gray-700">{result.vehiclesWithIssues} Issues</span>
                                </div>
                                {result.unallocatedFuel > 0.1 && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <span className="font-medium text-red-600">
                                            {formatNumber(result.unallocatedFuel)} L unallocated
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Warnings */}
                            {result.warnings && result.warnings.length > 0 && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                    <div className="font-medium text-amber-800 mb-2">Warnings</div>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        {result.warnings.slice(0, 5).map((warning, i) => (
                                            <li key={i}>• {warning}</li>
                                        ))}
                                        {result.warnings.length > 5 && (
                                            <li className="text-amber-600">
                                                ... and {result.warnings.length - 5} more
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Vehicle Table */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Vehicle Status</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Fuel Type</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Distance</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Consumed</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Allocated</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Balance</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {result.vehicleStatuses.map((vehicle) => (
                                            <tr key={vehicle.vehicleId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Car className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-900">
                                                                {vehicle.plateNumber}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{vehicle.fuelType}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {formatNumber(vehicle.totalDistanceDriven, 0)} km
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {formatNumber(vehicle.fuelConsumed)} L
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {formatNumber(vehicle.fuelAllocated)} L
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium ${
                                                    vehicle.currentFuelLevel < 0
                                                        ? 'text-red-600'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {formatNumber(vehicle.currentFuelLevel)} L
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(vehicle.status)}`}>
                                                            {getStatusIcon(vehicle.status)}
                                                            {vehicle.status}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        onClick={handleDownloadReport}
                        disabled={!result}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleRunAllocation}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Fuel className="w-4 h-4" />
                                    {result ? 'Re-run Allocation' : 'Run Allocation'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
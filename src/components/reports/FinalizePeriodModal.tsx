import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, AlertTriangle, Lock, Unlock, Fuel, ArrowRight, Users, Car } from 'lucide-react';
import {useAuthFetch} from "@/auth/AuthContext";
import { API_BASE_URL } from '@/config/api';

interface VehicleFuelUpdate {
    vehicleId: number;
    plateNumber: string;
    fuelType: string;
    previousInitialLevel: number;
    fuelAllocated: number;
    fuelConsumed: number;
    calculatedFinalLevel: number;
    newInitialLevel: number;
    hasDeficit: boolean;
}

interface DriverState {
    driverId: number;
    driverName: string;
    lastTripEndTime: string | null;
    hoursWorkedThisPeriod: number;
    tripsThisPeriod: number;
    incompleteWeekHours: number;
    consecutiveDaysWorked: number;
    lastRestDay: string | null;
    hoursSinceLastTrip: number;
    hasSufficientRest: boolean;
    warnings: string[];
}

interface FuelFinalizationSummary {
    vehiclesUpdated: number;
    vehiclesWithDeficit: number;
    totalFuelAllocated: number;
    totalFuelConsumed: number;
    vehicleUpdates: VehicleFuelUpdate[];
}

interface DriverFinalizationSummary {
    driversUpdated: number;
    driversWithWarnings: number;
    totalTripsAssigned: number;
    totalHoursWorked: number;
    driverStates: DriverState[];
}

interface FinalizationResult {
    periodId: number;
    finalizedAt: string;
    success: boolean;
    message: string;
    isPreview: boolean;
    fuelSummary: FuelFinalizationSummary | null;
    driverSummary: DriverFinalizationSummary | null;
    warnings: string[];
    errors: string[];
}

interface FinalizePeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    periodId: number;
    periodDescription: string;
    isAlreadyFinalized: boolean;
}

export function FinalizePeriodModal({
                                        isOpen,
                                        onClose,
                                        onSuccess,
                                        periodId,
                                        periodDescription,
                                        isAlreadyFinalized
                                    }: FinalizePeriodModalProps) {
    const authFetch = useAuthFetch();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isReverting, setIsReverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<FinalizationResult | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [activeTab, setActiveTab] = useState<'fuel' | 'drivers'>('fuel');

    // Load preview when modal opens
    useEffect(() => {
        if (isOpen && periodId && !isAlreadyFinalized) {
            loadPreview();
        }
    }, [isOpen, periodId, isAlreadyFinalized]);

    const loadPreview = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Use the unified endpoint in ReportController
            const response = await authFetch(`${API_BASE_URL}/reports/periods/${periodId}/finalize/preview`);
            const result = await response.json();

            if (response.ok && result.data) {
                setPreviewData(result.data);
            } else {
                setError(result.message || "Failed to load preview");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = async () => {
        setIsFinalizing(true);
        setError(null);

        try {
            // Use the unified endpoint in ReportController
            const response = await authFetch(`${API_BASE_URL}/reports/periods/${periodId}/finalize`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok) {
                alert(`✅ Period Finalized!\n\n${result.data?.message || result.message}`);
                onSuccess();
                onClose();
            } else {
                setError(result.message || "Finalization failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsFinalizing(false);
            setShowConfirmation(false);
        }
    };

    const handleRevert = async () => {
        if (!confirm("Are you sure you want to revert this finalization?\n\nVehicle fuel levels and driver states may need manual correction.")) {
            return;
        }

        setIsReverting(true);
        setError(null);

        try {
            // Use the unified endpoint in ReportController
            const response = await authFetch(`${API_BASE_URL}/reports/periods/${periodId}/finalize/revert`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok) {
                alert(`✅ Finalization Reverted!\n\n${result.data || result.message}`);
                onSuccess();
                onClose();
            } else {
                setError(result.message || "Revert failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsReverting(false);
        }
    };

    const formatNumber = (num: number) => num.toFixed(1);
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAlreadyFinalized ? 'bg-emerald-50' : 'bg-purple-50'}`}>
                            {isAlreadyFinalized ? (
                                <Lock className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <Lock className="w-5 h-5 text-purple-600" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isAlreadyFinalized ? 'Period Finalized' : 'Finalize Period'}
                            </h2>
                            <p className="text-sm text-gray-500">{periodDescription}</p>
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
                    {/* Already Finalized State */}
                    {isAlreadyFinalized && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                This period has been finalized
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Vehicle fuel levels and driver states have been updated for the next period.
                            </p>
                            <button
                                onClick={handleRevert}
                                disabled={isReverting}
                                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {isReverting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Unlock className="w-4 h-4" />
                                )}
                                Revert Finalization
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {!isAlreadyFinalized && isLoading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                            <p className="text-gray-500">Loading preview...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 mb-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Preview Data */}
                    {!isAlreadyFinalized && previewData && !isLoading && (
                        <>
                            {/* Warning Banner */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-amber-800">Important</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Finalizing this period will update <strong>vehicle fuel levels</strong> and
                                            <strong> driver states</strong> (rest hours, weekly hours) for the <strong>next period</strong>.
                                            This should only be done when you're confident all data is correct.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings from preview */}
                            {previewData.warnings && previewData.warnings.length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-red-800">Warnings</h4>
                                            <ul className="text-sm text-red-700 mt-1 list-disc ml-4">
                                                {previewData.warnings.map((w, i) => (
                                                    <li key={i}>{w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
                                        <Car className="w-4 h-4" />
                                        Vehicles
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {previewData.fuelSummary?.vehiclesUpdated || 0}
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-1">
                                        <Fuel className="w-4 h-4" />
                                        Fuel Allocated
                                    </div>
                                    <div className="text-2xl font-bold text-amber-900">
                                        {formatNumber(previewData.fuelSummary?.totalFuelAllocated || 0)}L
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-1">
                                        <Users className="w-4 h-4" />
                                        Drivers
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-900">
                                        {previewData.driverSummary?.driversUpdated || 0}
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-purple-600 text-sm font-medium mb-1">
                                        Total Trips
                                    </div>
                                    <div className="text-2xl font-bold text-purple-900">
                                        {previewData.driverSummary?.totalTripsAssigned || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 mb-4">
                                <button
                                    onClick={() => setActiveTab('fuel')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'fuel'
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Fuel className="w-4 h-4" />
                                        Fuel Changes ({previewData.fuelSummary?.vehiclesUpdated || 0})
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('drivers')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'drivers'
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Driver States ({previewData.driverSummary?.driversUpdated || 0})
                                    </span>
                                </button>
                            </div>

                            {/* Fuel Tab */}
                            {activeTab === 'fuel' && previewData.fuelSummary && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Previous</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">+Allocated</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">-Consumed</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-600"></th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">New Initial</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {previewData.fuelSummary.vehicleUpdates.map((vehicle) => (
                                            <tr key={vehicle.vehicleId} className={vehicle.hasDeficit ? 'bg-red-50/50' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                                                    <div className="text-xs text-gray-500">{vehicle.fuelType}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {formatNumber(vehicle.previousInitialLevel)}L
                                                </td>
                                                <td className="px-4 py-3 text-right text-emerald-600">
                                                    +{formatNumber(vehicle.fuelAllocated)}L
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-600">
                                                    -{formatNumber(vehicle.fuelConsumed)}L
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <ArrowRight className="w-4 h-4 text-gray-400 inline" />
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium ${
                                                    vehicle.hasDeficit ? 'text-red-600' : 'text-gray-900'
                                                }`}>
                                                    {formatNumber(vehicle.newInitialLevel)}L
                                                    {vehicle.hasDeficit && (
                                                        <span className="text-xs ml-1">(deficit!)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Drivers Tab */}
                            {activeTab === 'drivers' && previewData.driverSummary && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-600">Trips</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Hours</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Week Hours</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-600">Last Trip</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {previewData.driverSummary.driverStates
                                            .filter(d => d.tripsThisPeriod > 0)
                                            .map((driver) => (
                                                <tr key={driver.driverId} className={driver.warnings.length > 0 ? 'bg-amber-50/50' : ''}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{driver.driverName}</div>
                                                        {driver.warnings.length > 0 && (
                                                            <div className="text-xs text-amber-600">{driver.warnings[0]}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-600">
                                                        {driver.tripsThisPeriod}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600">
                                                        {formatNumber(driver.hoursWorkedThisPeriod)}h
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600">
                                                        {formatNumber(driver.incompleteWeekHours)}h
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                                                        {formatDate(driver.lastTripEndTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {driver.warnings.length > 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Warning
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                                <CheckCircle className="w-3 h-3" />
                                                                OK
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Confirmation Checkbox */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showConfirmation}
                                        onChange={(e) => setShowConfirmation(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I understand that finalizing this period will update vehicle fuel levels and driver states 
                                        for the next period, and this should only be done when all data is confirmed correct.
                                    </span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!isAlreadyFinalized && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFinalize}
                            disabled={isFinalizing || !showConfirmation || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFinalizing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Finalizing...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Finalize Period
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
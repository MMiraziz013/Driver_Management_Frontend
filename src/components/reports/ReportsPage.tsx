import React, { useEffect, useState } from "react";
import {
    Download,
    Plus,
    Loader2,
    PlayCircle,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Upload,
    Calendar,
    Fuel,
    ChevronDown,
    Lock,
    CheckCircle
} from "lucide-react";
import { CreateReportPeriodModal } from "./CreateReportPeriodModal";
import { UploadTripsModal } from "./UploadTripsModal";
import { UploadGasPurchasesModal } from "./UploadGasPurchasesModal";
import { FuelAllocationModal } from "./FuelAllocationModal";
import { FinalizePeriodModal } from "./FinalizePeriodModal";

const API_BASE = "http://localhost:5147/api";

interface ReportPeriod {
    id: number;
    startDate: string;
    endDate: string;
    description: string;
    status: string;
    tripCount?: number;
    assignedCount?: number;
    conflictCount?: number;
    // Unified finalization status
    isFinalized?: boolean;
    finalizedAt?: string;
    // Individual statuses (for backward compatibility)
    isFuelFinalized?: boolean;
    fuelFinalizedAt?: string;
    isAssignmentFinalized?: boolean;
    assignmentFinalizedAt?: string;
}

export function ReportsPage() {
    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [processingAction, setProcessingAction] = useState<string>("");

    // Modals
    const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);
    const [isUploadTripsModalOpen, setIsUploadTripsModalOpen] = useState(false);
    const [isUploadGasModalOpen, setIsUploadGasModalOpen] = useState(false);
    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null);

    // Dropdown menus
    const [openUploadMenuId, setOpenUploadMenuId] = useState<number | null>(null);
    const [openExportMenuId, setOpenExportMenuId] = useState<number | null>(null);

    const fetchPeriods = async () => {
        try {
            const response = await fetch(`${API_BASE}/report-periods`);

            if (response.status === 204 || response.headers.get("content-length") === "0") {
                setPeriods([]);
                return;
            }

            const result = await response.json();

            if (response.ok && result.data) {
                setPeriods(result.data);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown-upload]')) {
                setOpenUploadMenuId(null);
            }
            if (!target.closest('[data-dropdown-export]')) {
                setOpenExportMenuId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Helper to check if period is finalized (supports both old and new field names)
    const isPeriodFinalized = (period: ReportPeriod): boolean => {
        return period.isFinalized || period.isFuelFinalized || false;
    };

    // Run auto-assignment engine
    const handleRunAssignment = async (periodId: number, period: ReportPeriod) => {
        if (isPeriodFinalized(period)) {
            alert("⚠️ This period is already finalized. You cannot re-run assignments.");
            return;
        }

        setProcessingId(periodId);
        setProcessingAction("assignment");
        try {
            const response = await fetch(`${API_BASE}/reports/assign/${periodId}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok) {
                alert(`✅ Assignment Complete!\n\n${result.data || result.message}`);
                fetchPeriods();
            } else {
                alert("❌ Error: " + (result.message || "Assignment failed"));
            }
        } catch (error) {
            alert("❌ Failed to connect to the assignment engine.");
        } finally {
            setProcessingId(null);
            setProcessingAction("");
        }
    };

    // Run fuel allocation
    const handleRunFuelAllocation = async (periodId: number, period: ReportPeriod) => {
        if (isPeriodFinalized(period)) {
            alert("⚠️ This period is already finalized. You cannot re-run fuel allocation.");
            return;
        }

        setProcessingId(periodId);
        setProcessingAction("fuel");
        try {
            const response = await fetch(`${API_BASE}/gas/allocate/${periodId}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (response.ok) {
                alert(`✅ Fuel Allocation Complete!\n\nAllocated: ${result.data?.totalFuelAllocated?.toFixed(1) || 0}L\nVehicles OK: ${result.data?.vehiclesOk || 0}\nIssues: ${result.data?.vehiclesWithIssues || 0}`);
                fetchPeriods();
            } else {
                alert("❌ Error: " + (result.message || "Fuel allocation failed"));
            }
        } catch (error) {
            alert("❌ Failed to connect to the fuel allocation service.");
        } finally {
            setProcessingId(null);
            setProcessingAction("");
        }
    };

    // Download assignment report (Excel)
    const handleDownloadAssignments = async (periodId: number, description: string) => {
        setOpenExportMenuId(null);
        try {
            const response = await fetch(`${API_BASE}/reports/export/${periodId}`);

            if (!response.ok) {
                alert("❌ Export failed. Make sure assignments were generated first.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Assignment_Report_${description}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Download error:", error);
            alert("❌ Download failed.");
        }
    };

    // Download fuel allocation report (CSV)
    const handleDownloadFuelReport = async (periodId: number, description: string) => {
        setOpenExportMenuId(null);
        try {
            const response = await fetch(`${API_BASE}/gas/export-detailed/${periodId}`);

            if (!response.ok) {
                alert("❌ Export failed. Make sure fuel allocation was run first.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Fuel_Report_${description}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Download error:", error);
            alert("❌ Download failed.");
        }
    };

    // Open modals
    const handleOpenUploadTrips = (periodId: number) => {
        setSelectedPeriod(periods.find(p => p.id === periodId) || null);
        setIsUploadTripsModalOpen(true);
        setOpenUploadMenuId(null);
    };

    const handleOpenUploadGas = (periodId: number) => {
        setSelectedPeriod(periods.find(p => p.id === periodId) || null);
        setIsUploadGasModalOpen(true);
        setOpenUploadMenuId(null);
    };

    const handleOpenFinalize = (period: ReportPeriod) => {
        setSelectedPeriod(period);
        setIsFinalizeModalOpen(true);
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const getStatusBadge = (period: ReportPeriod) => {
        // If period is finalized, show that prominently
        if (isPeriodFinalized(period)) {
            return (
                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Finalized
                </span>
            );
        }

        const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            'Draft': {
                bg: 'bg-slate-50 border-slate-200',
                text: 'text-slate-600',
                icon: <FileText className="w-3.5 h-3.5" />
            },
            'Processing': {
                bg: 'bg-amber-50 border-amber-200',
                text: 'text-amber-700',
                icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />
            },
            'Assigned': {
                bg: 'bg-blue-50 border-blue-200',
                text: 'text-blue-700',
                icon: <CheckCircle2 className="w-3.5 h-3.5" />
            },
            'HasConflicts': {
                bg: 'bg-red-50 border-red-200',
                text: 'text-red-700',
                icon: <AlertTriangle className="w-3.5 h-3.5" />
            },
        };

        const config = statusConfig[period.status] || statusConfig['Draft'];

        return (
            <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
                {config.icon}
                {period.status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fleet Reports</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage report periods, upload trips, run assignments, and allocate fuel.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreatePeriodModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-medium"
                >
                    <Plus className="w-5 h-5" />
                    New Report Period
                </button>
            </div>

            {/* Empty State */}
            {periods.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Periods Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Create your first report period to start uploading trips and managing fleet assignments.
                    </p>
                    <button
                        onClick={() => setIsCreatePeriodModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Report Period
                    </button>
                </div>
            ) : (
                /* Table */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Period
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                                Trips
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {periods.map((period) => {
                            const finalized = isPeriodFinalized(period);
                            return (
                                <tr key={period.id} className={`hover:bg-gray-50/50 transition-colors ${finalized ? 'bg-emerald-50/30' : ''}`}>
                                    {/* Period Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${finalized ? 'bg-emerald-100' : 'bg-indigo-50'}`}>
                                                {finalized ? (
                                                    <Lock className="text-emerald-600 w-5 h-5" />
                                                ) : (
                                                    <FileText className="text-indigo-600 w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {period.description}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDateRange(period.startDate, period.endDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        {getStatusBadge(period)}
                                    </td>

                                    {/* Trip Count */}
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            {period.tripCount ?? '-'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end items-center gap-2">

                                            {/* Upload Dropdown */}
                                            <div className="relative" data-dropdown-upload>
                                                <button
                                                    onClick={() => setOpenUploadMenuId(openUploadMenuId === period.id ? null : period.id)}
                                                    disabled={finalized}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Upload
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>

                                                {openUploadMenuId === period.id && !finalized && (
                                                    <div
                                                        className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                                        data-dropdown-upload
                                                    >
                                                        <button
                                                            onClick={() => handleOpenUploadTrips(period.id)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            Trip Report
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenUploadGas(period.id)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <Fuel className="w-4 h-4 text-amber-500" />
                                                            Gas Purchases
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Run Assignment */}
                                            <button
                                                onClick={() => handleRunAssignment(period.id, period)}
                                                disabled={processingId === period.id || finalized}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={finalized ? "Period is finalized" : "Run Auto-Assignment"}
                                            >
                                                {processingId === period.id && processingAction === "assignment" ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <PlayCircle className="w-4 h-4" />
                                                )}
                                                Assign
                                            </button>

                                            {/* Run Fuel Allocation */}
                                            <button
                                                onClick={() => handleRunFuelAllocation(period.id, period)}
                                                disabled={processingId === period.id || finalized}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={finalized ? "Period is finalized" : "Run Fuel Allocation"}
                                            >
                                                {processingId === period.id && processingAction === "fuel" ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Fuel className="w-4 h-4" />
                                                )}
                                                Fuel
                                            </button>

                                            {/* Finalize Button */}
                                            <button
                                                onClick={() => handleOpenFinalize(period)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                    finalized
                                                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                        : 'text-purple-600 hover:bg-purple-50'
                                                }`}
                                                title={finalized ? "View finalization" : "Finalize period"}
                                            >
                                                {finalized ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                                {finalized ? 'Finalized' : 'Finalize'}
                                            </button>

                                            {/* Export Dropdown */}
                                            <div className="relative" data-dropdown-export>
                                                <button
                                                    onClick={() => setOpenExportMenuId(openExportMenuId === period.id ? null : period.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Export
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>

                                                {openExportMenuId === period.id && (
                                                    <div
                                                        className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                                        data-dropdown-export
                                                    >
                                                        <button
                                                            onClick={() => handleDownloadAssignments(period.id, period.description)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            Assignment Report
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadFuelReport(period.id, period.description)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <Fuel className="w-4 h-4 text-amber-500" />
                                                            Fuel Report (CSV)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <CreateReportPeriodModal
                isOpen={isCreatePeriodModalOpen}
                onClose={() => setIsCreatePeriodModalOpen(false)}
                onSuccess={() => {
                    fetchPeriods();
                    setIsCreatePeriodModalOpen(false);
                }}
            />

            <UploadTripsModal
                isOpen={isUploadTripsModalOpen}
                onClose={() => {
                    setIsUploadTripsModalOpen(false);
                    setSelectedPeriod(null);
                }}
                onSuccess={() => {
                    fetchPeriods();
                    setIsUploadTripsModalOpen(false);
                    setSelectedPeriod(null);
                }}
                periodId={selectedPeriod?.id || null}
                periods={periods}
            />

            <UploadGasPurchasesModal
                isOpen={isUploadGasModalOpen}
                onClose={() => {
                    setIsUploadGasModalOpen(false);
                    setSelectedPeriod(null);
                }}
                onSuccess={() => {
                    fetchPeriods();
                    setIsUploadGasModalOpen(false);
                    setSelectedPeriod(null);
                }}
                periodId={selectedPeriod?.id || null}
                periods={periods}
            />

            {selectedPeriod && (
                <>
                    <FuelAllocationModal
                        isOpen={isFuelModalOpen}
                        onClose={() => {
                            setIsFuelModalOpen(false);
                            setSelectedPeriod(null);
                        }}
                        periodId={selectedPeriod.id}
                    />

                    <FinalizePeriodModal
                        isOpen={isFinalizeModalOpen}
                        onClose={() => {
                            setIsFinalizeModalOpen(false);
                            setSelectedPeriod(null);
                        }}
                        onSuccess={() => {
                            fetchPeriods();
                            setIsFinalizeModalOpen(false);
                            setSelectedPeriod(null);
                        }}
                        periodId={selectedPeriod.id}
                        periodDescription={selectedPeriod.description}
                        isAlreadyFinalized={isPeriodFinalized(selectedPeriod)}
                    />
                </>
            )}
        </div>
    );
}
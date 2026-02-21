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
    CheckCircle,
    Map,
    ClipboardList
} from "lucide-react";
import { CreateReportPeriodModal } from "./CreateReportPeriodModal";
import { UploadTripsModal } from "./UploadTripsModal";
import { UploadGasPurchasesModal } from "./UploadGasPurchasesModal";
import { FuelAllocationModal } from "./FuelAllocationModal";
import { FinalizePeriodModal } from "./FinalizePeriodModal";
import {useAuthFetch} from "@/auth/AuthContext";
import { API_BASE_URL } from '@/config/api';

interface ReportPeriod {
    id: number;
    startDate: string;
    endDate: string;
    description: string;
    status: string;
    tripCount?: number;
    assignedCount?: number;
    conflictCount?: number;
    isFinalized?: boolean;
    finalizedAt?: string;
    isFuelFinalized?: boolean;
    fuelFinalizedAt?: string;
    isAssignmentFinalized?: boolean;
    assignmentFinalizedAt?: string;
}

interface JourneyDto {
    journeyNumber: number;
    date: string;
    driverId: number;
    driverName: string;
    vehicleId: number;
    vehiclePlate: string;
    vehicleModel: string;
    departureTime: string;
    returnTime: string;
    totalDistanceKm: number;
    totalFuelConsumed: number;
    tripCount: number;
    companies: string;
    confNumbers: string[];
}

export function ReportsPage() {
    const authFetch = useAuthFetch();
    
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
    const [isJourneysModalOpen, setIsJourneysModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null);

    // Journeys data
    const [journeys, setJourneys] = useState<JourneyDto[]>([]);
    const [journeysLoading, setJourneysLoading] = useState(false);

    // Dropdown menus
    const [openUploadMenuId, setOpenUploadMenuId] = useState<number | null>(null);
    const [openExportMenuId, setOpenExportMenuId] = useState<number | null>(null);

    const fetchPeriods = async () => {
        try {
            const response = await authFetch(`${API_BASE_URL}/report-periods`);

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
            const response = await authFetch(`${API_BASE}/reports/assign/${periodId}`, {
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
            const response = await authFetch(`${API_BASE}/gas/allocate/${periodId}`, {
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
            const response = await authFetch(`${API_BASE}/reports/export/${periodId}`);

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
            const response = await authFetch(`${API_BASE}/gas/export-detailed/${periodId}`);

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

    // Download waybill report (Путевой лист)
    const handleDownloadWaybill = async (periodId: number, period: ReportPeriod) => {
        setOpenExportMenuId(null);
        setProcessingId(periodId);
        setProcessingAction("waybill");

        try {
            const response = await authFetch(`${API_BASE}/reports/export-waybill/${periodId}`);

            if (!response.ok) {
                const errorText = await response.text();
                alert(`❌ Export failed: ${errorText || "Make sure assignments were generated first."}`);
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Create filename with Russian date format
            const startDate = new Date(period.startDate);
            const endDate = new Date(period.endDate);
            const formatDate = (d: Date) => d.toISOString().split('T')[0];
            a.download = `Путевой_лист_${formatDate(startDate)}_${formatDate(endDate)}.xlsx`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Download error:", error);
            alert("❌ Download failed.");
        } finally {
            setProcessingId(null);
            setProcessingAction("");
        }
    };

    // Fetch journeys for a period
    const handleViewJourneys = async (period: ReportPeriod) => {
        setSelectedPeriod(period);
        setIsJourneysModalOpen(true);
        setJourneysLoading(true);
        setOpenExportMenuId(null);

        try {
            const response = await authFetch(`${API_BASE}/reports/journeys/${period.id}`);

            if (response.ok) {
                const result = await response.json();
                // Handle both wrapped response { data: [...] } and direct array [...]
                const journeysData = Array.isArray(result) ? result : (result.data || result || []);
                setJourneys(journeysData);
            } else {
                alert("❌ Failed to load journeys. Make sure assignments were run first.");
                setJourneys([]);
            }
        } catch (error) {
            console.error("Fetch journeys error:", error);
            alert("❌ Failed to load journeys");
            setJourneys([]);
        } finally {
            setJourneysLoading(false);
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
                                                    disabled={processingId === period.id && processingAction === "waybill"}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === period.id && processingAction === "waybill" ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Download className="w-4 h-4" />
                                                    )}
                                                    Export
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>

                                                {openExportMenuId === period.id && (
                                                    <div
                                                        className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
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
                                                            Fuel Report (ZIP)
                                                        </button>

                                                        <div className="border-t border-gray-100 my-1"></div>

                                                        <button
                                                            onClick={() => handleDownloadWaybill(period.id, period)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <ClipboardList className="w-4 h-4 text-emerald-500" />
                                                            <div>
                                                                <div>Путевой лист (Waybill)</div>
                                                                <div className="text-xs text-gray-400">Grouped by vehicle</div>
                                                            </div>
                                                        </button>

                                                        <button
                                                            onClick={() => handleViewJourneys(period)}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <Map className="w-4 h-4 text-purple-500" />
                                                            <div>
                                                                <div>View Journeys</div>
                                                                <div className="text-xs text-gray-400">Preview grouped trips</div>
                                                            </div>
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

            {/* Journeys Modal */}
            {isJourneysModalOpen && selectedPeriod && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <Map className="w-5 h-5 text-purple-500" />
                                    Journeys - {selectedPeriod.description}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Trips grouped by vehicle and driver
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsJourneysModalOpen(false);
                                    setSelectedPeriod(null);
                                    setJourneys([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {journeysLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                            ) : journeys.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Map className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No journeys found for this period.</p>
                                    <p className="text-sm">Make sure assignments have been run.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-blue-700">{journeys?.length || 0}</div>
                                            <div className="text-sm text-blue-600">Total Journeys</div>
                                        </div>
                                        <div className="bg-emerald-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-emerald-700">
                                                {Array.isArray(journeys) ? journeys.reduce((sum, j) => sum + (j.tripCount || 0), 0) : 0}
                                            </div>
                                            <div className="text-sm text-emerald-600">Total Trips</div>
                                        </div>
                                        <div className="bg-amber-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-amber-700">
                                                {Array.isArray(journeys) ? journeys.reduce((sum, j) => sum + (j.totalDistanceKm || 0), 0).toFixed(0) : 0} km
                                            </div>
                                            <div className="text-sm text-amber-600">Total Distance</div>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-purple-700">
                                                {Array.isArray(journeys) ? journeys.reduce((sum, j) => sum + (j.totalFuelConsumed || 0), 0).toFixed(1) : 0} L
                                            </div>
                                            <div className="text-sm text-purple-600">Fuel Consumed</div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">№</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">Vehicle</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-600">Companies</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600">Trips</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600">Distance</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-600">Fuel</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                            {journeys.map((journey, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-500">{journey.journeyNumber}</td>
                                                    <td className="px-4 py-3">
                                                        {new Date(journey.date).toLocaleDateString('ru-RU')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{journey.vehiclePlate}</div>
                                                        <div className="text-xs text-gray-400">{journey.vehicleModel}</div>
                                                    </td>
                                                    <td className="px-4 py-3">{journey.driverName}</td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {journey.departureTime.substring(0, 5)} - {journey.returnTime.substring(0, 5)}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs truncate" title={journey.companies}>
                                                        {journey.companies}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                                                journey.tripCount > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {journey.tripCount}
                                                            </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {journey.totalDistanceKm.toFixed(1)} km
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-amber-600">
                                                        {journey.totalFuelConsumed.toFixed(2)} L
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                            <button
                                onClick={() => handleDownloadWaybill(selectedPeriod.id, selectedPeriod)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download Waybill (Excel)
                            </button>
                            <button
                                onClick={() => {
                                    setIsJourneysModalOpen(false);
                                    setSelectedPeriod(null);
                                    setJourneys([]);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
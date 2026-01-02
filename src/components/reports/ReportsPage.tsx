import React, { useEffect, useState } from "react";
import { Download, Plus, Loader2, PlayCircle, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { CreateReportModal } from "@/components/reports/CreateReportModal";

// Adjusted to match your GetReportPeriodDto
interface ReportPeriod {
    id: number;
    startDate: string;
    endDate: string;
    description: string;
    status: string; // "Draft", "Finalized", etc.
}

export function ReportsPage() {
    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const API_BASE = "http://localhost:5147/api/report-periods";

    const fetchPeriods = async () => {
        try {
            const response = await fetch('http://localhost:5147/api/report-periods');

            // 1. Check if the response is empty (status 204) or has no content length
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                setPeriods([]);
                return;
            }

            const result = await response.json();

            if (response.ok && result.data) {
                setPeriods(result.data);
            }
        } catch (error) {
            // This is where your "Unexpected end of JSON" was being caught
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPeriods(); }, []);

    // Phase 2: Trigger the heavy assignment engine
    const handleRunAssignment = async (periodId: number) => {
        setProcessingId(periodId);
        try {
            const response = await fetch(`http://localhost:5147/api/reports/assign/${periodId}`, { method: 'POST' });
            const result = await response.json();

            if (response.ok) {
                // result.data contains your "Assigned: X/Y, Conflicts: Z" string
                alert(result.data);
                fetchPeriods(); // Refresh to see updated status
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("Failed to connect to the assignment engine.");
        } finally {
            setProcessingId(null);
        }
    };

    // Phase 3: Download the generated Excel
    const handleDownload = async (periodId: number, description: string) => {
        try {
            const response = await fetch(`http://localhost:5147/api/reports/export/${periodId}`);

            if (!response.ok) {
                alert("Export failed. Make sure assignments were generated first.");
                return;
            }

            // IMPORTANT: Use .blob() for files, NOT .json()
            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Report_${description}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="p-6 bg-white min-h-screen text-black">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Fleet Reports</h1>
                    <p className="text-slate-500 text-sm">Upload trips, run auto-assignment, and export schedules.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    New Upload
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Period / Date Range</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {periods.map((period) => (
                        <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <FileText className="text-indigo-600 w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-black">{period.description}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${
                                        period.status === 'Finalized'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                        {period.status === 'Finalized' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                        {period.status}
                                    </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => handleRunAssignment(period.id)}
                                        disabled={processingId === period.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-600 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-50"
                                    >
                                        {processingId === period.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                        {processingId === period.id ? 'Assigning...' : 'Run Engine'}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(period.id, period.description)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <CreateReportModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchPeriods}
            />
        </div>
    );
}
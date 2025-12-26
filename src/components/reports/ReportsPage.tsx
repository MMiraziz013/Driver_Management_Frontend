import React, { useState } from "react";
import {Download, Plus} from "lucide-react";
import { CreateReportModal } from "@/components/reports/CreateReportModal";


interface Report {
    id: string;
    type: string;
    dateCreated: string;
    downloaded: boolean;
}

interface CreateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockReports: Report[] = [
    {
        id: '1',
        type: 'Monthly Fleet Report',
        dateCreated: '2024-12-01',
        downloaded: true,
    },
    {
        id: '2',
        type: 'Driver Performance',
        dateCreated: '2024-12-05',
        downloaded: false,
    },
    {
        id: '3',
        type: 'Vehicle Maintenance',
        dateCreated: '2024-12-08',
        downloaded: true,
    },
    {
        id: '4',
        type: 'Fuel Consumption',
        dateCreated: '2024-12-10',
        downloaded: false,
    },
    {
        id: '5',
        type: 'Safety Incidents',
        dateCreated: '2024-12-12',
        downloaded: true,
    },
    {
        id: '6',
        type: 'Weekly Summary',
        dateCreated: '2024-12-13',
        downloaded: false,
    },
];

export function ReportsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Helper function to close the modal
    const handleCloseModal = () => setIsCreateModalOpen(false);

    return (
        <div>
            {/* Header and Button */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create a Report
                </button>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">
                                Date Created
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {mockReports.map((report, index) => (
                            <tr
                                key={report.id}
                                className={`border-b border-slate-200 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                } hover:bg-slate-100/50 transition-colors`}
                            >
                                <td className="px-6 py-4 text-slate-900">{report.type}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    {new Date(report.dateCreated).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            report.downloaded
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {report.downloaded ? 'Downloaded' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        title="Download Report"
                                        className="text-slate-500 hover:text-indigo-600 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FIX: Render the Modal component here */}
            <CreateReportModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}
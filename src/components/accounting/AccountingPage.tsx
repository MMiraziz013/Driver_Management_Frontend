'use client';

import React, { useState, useEffect } from 'react';
import {
    Upload,
    FileSpreadsheet,
    DollarSign,
    TrendingUp,
    Car,
    Building2,
    Users,
    Calendar,
    Trash2,
    Download,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Settings,
} from 'lucide-react';
import {
    ExchangeRateDto,
    AccountingReportDto,
    AnalysisReportDto,
    getExchangeRates,
    saveExchangeRate,
    getAccountingReports,
    uploadAccountingReport,
    deleteAccountingReport,
    generateAnalysisReport,
    exportAnalysisReport, exportCarRevenueReport, generateCarRevenueReport, CarRevenueReportDto, FarmOutReportDto,
    exportFarmOutReport, generateFarmOutReport, CompanyRevenueReportDto, exportCompanyRevenueReport,
    generateCompanyRevenueReport,
} from '@/services/accountingService';

type ReportTab = 'analysis' | 'car-revenue' | 'farm-out' | 'company-revenue';
type SettingsTab = 'upload' | 'exchange-rates';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AVAILABLE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

export default function AccountingPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<ReportTab>('analysis');
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('upload');
    
    // Company Revenue state
    const [companyRevenueYear, setCompanyRevenueYear] = useState(new Date().getFullYear());
    const [companyRevenueMonths, setCompanyRevenueMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const [companyRevenueReport, setCompanyRevenueReport] = useState<CompanyRevenueReportDto | null>(null);
    const [generatingCompanyRevenue, setGeneratingCompanyRevenue] = useState(false);

    // Data state
    const [exchangeRates, setExchangeRates] = useState<ExchangeRateDto[]>([]);
    const [uploadedReports, setUploadedReports] = useState<AccountingReportDto[]>([]);
    const [analysisReport, setAnalysisReport] = useState<AnalysisReportDto | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Upload state
    const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
    const [uploadMonth, setUploadMonth] = useState(new Date().getMonth() + 1);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Exchange rate editing
    const [editingRate, setEditingRate] = useState<{ year: number; rate: string } | null>(null);

    // Analysis report state
    const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026]);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const [generatingReport, setGeneratingReport] = useState(false);

    const [carRevenueYear, setCarRevenueYear] = useState(new Date().getFullYear());
    const [carRevenueMonths, setCarRevenueMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const [carRevenueReport, setCarRevenueReport] = useState<CarRevenueReportDto | null>(null);
    const [generatingCarRevenue, setGeneratingCarRevenue] = useState(false);

    const [farmOutYear, setFarmOutYear] = useState(new Date().getFullYear());
    const [farmOutMonths, setFarmOutMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const [farmOutReport, setFarmOutReport] = useState<FarmOutReportDto | null>(null);
    const [generatingFarmOut, setGeneratingFarmOut] = useState(false);



    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [ratesRes, reportsRes] = await Promise.all([
                getExchangeRates(),
                getAccountingReports(),
            ]);

            if (ratesRes.data) setExchangeRates(ratesRes.data);
            if (reportsRes.data) setUploadedReports(reportsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // ============ Upload Handlers ============

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await uploadAccountingReport(uploadFile, uploadYear, uploadMonth);
            if (result.data) {
                setSuccess(`Imported ${result.data.transactionsImported} transactions for ${MONTHS[uploadMonth - 1]} ${uploadYear}`);
                setUploadFile(null);
                // Reset file input
                const fileInput = document.getElementById('accounting-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                // Reload reports
                const reportsRes = await getAccountingReports();
                if (reportsRes.data) setUploadedReports(reportsRes.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteReport = async (year: number, month: number) => {
        if (!confirm(`Delete report for ${MONTHS[month - 1]} ${year}?`)) return;

        try {
            await deleteAccountingReport(year, month);
            setSuccess(`Deleted report for ${MONTHS[month - 1]} ${year}`);
            const reportsRes = await getAccountingReports();
            if (reportsRes.data) setUploadedReports(reportsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    // ============ Exchange Rate Handlers ============

    const handleSaveExchangeRate = async (year: number, rate: string) => {
        const rateNum = parseFloat(rate);
        if (isNaN(rateNum) || rateNum <= 0) {
            setError('Invalid exchange rate');
            return;
        }

        try {
            await saveExchangeRate({ year, rate: rateNum });
            setEditingRate(null);
            setSuccess(`Exchange rate for ${year} saved`);
            const ratesRes = await getExchangeRates();
            if (ratesRes.data) setExchangeRates(ratesRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save exchange rate');
        }
    };

    // ============ Analysis Report Handlers ============

    const toggleYear = (year: number) => {
        setSelectedYears(prev =>
            prev.includes(year)
                ? prev.filter(y => y !== year)
                : [...prev, year].sort()
        );
    };

    const handleGenerateAnalysis = async () => {
        if (selectedYears.length < 2) {
            setError('Select at least 2 years for comparison');
            return;
        }
        if (selectedMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        setGeneratingReport(true);
        setError(null);

        try {
            const result = await generateAnalysisReport({
                years: selectedYears,
                months: selectedMonths  // Add this
            });
            if (result.data) {
                setAnalysisReport(result.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to generate report');
        } finally {
            setGeneratingReport(false);
        }
    };
    
    const handleExportAnalysis = async () => {
        if (selectedYears.length < 2) {
            setError('Select at least 2 years for export');
            return;
        }

        try {
            const blob = await exportAnalysisReport({
                years: selectedYears,
                months: selectedMonths
            });            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Analysis_Report_${selectedYears.join('-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Export failed');
        }
    };

    const toggleMonth = (month: number) => {
        setSelectedMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month].sort((a, b) => a - b)
        );
    };

    const selectAllMonths = () => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const clearAllMonths = () => setSelectedMonths([]);

    // Add toggle function for car revenue months
    const toggleCarRevenueMonth = (month: number) => {
        setCarRevenueMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month].sort((a, b) => a - b)
        );
    };

    // Add handler functions
    const handleGenerateCarRevenue = async () => {
        if (carRevenueMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        setGeneratingCarRevenue(true);
        setError(null);

        try {
            const result = await generateCarRevenueReport({
                year: carRevenueYear,
                months: carRevenueMonths
            });
            if (result.data) {
                setCarRevenueReport(result.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to generate report');
        } finally {
            setGeneratingCarRevenue(false);
        }
    };

    const handleExportCarRevenue = async () => {
        if (carRevenueMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        try {
            const blob = await exportCarRevenueReport({
                year: carRevenueYear,
                months: carRevenueMonths
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Car_Revenue_${carRevenueYear}_${carRevenueMonths.join('-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Export failed');
        }
    };
    
    const toggleFarmOutMonth = (month: number) => {
        setFarmOutMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month].sort((a, b) => a - b)
        );
    };

    const handleGenerateFarmOut = async () => {
        if (farmOutMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        setGeneratingFarmOut(true);
        setError(null);

        try {
            const result = await generateFarmOutReport({
                year: farmOutYear,
                months: farmOutMonths
            });
            if (result.data) {
                setFarmOutReport(result.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to generate report');
        } finally {
            setGeneratingFarmOut(false);
        }
    };

    const handleExportFarmOut = async () => {
        if (farmOutMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        try {
            const blob = await exportFarmOutReport({
                year: farmOutYear,
                months: farmOutMonths
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Farm_Out_${farmOutYear}_${farmOutMonths.join('-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Export failed');
        }
    };
    
    // Companies Report Handlers

    const toggleCompanyRevenueMonth = (month: number) => {
        setCompanyRevenueMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month].sort((a, b) => a - b)
        );
    };

    const handleGenerateCompanyRevenue = async () => {
        if (companyRevenueMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        setGeneratingCompanyRevenue(true);
        setError(null);

        try {
            const result = await generateCompanyRevenueReport({
                year: companyRevenueYear,
                months: companyRevenueMonths
            });
            if (result.data) {
                setCompanyRevenueReport(result.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.errors?.[0] || 'Failed to generate report');
        } finally {
            setGeneratingCompanyRevenue(false);
        }
    };

    const handleExportCompanyRevenue = async () => {
        if (companyRevenueMonths.length === 0) {
            setError('Select at least 1 month');
            return;
        }

        try {
            const blob = await exportCompanyRevenueReport({
                year: companyRevenueYear,
                months: companyRevenueMonths
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Company_Revenue_${companyRevenueYear}_${companyRevenueMonths.join('-')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Export failed');
        }
    };

    // ============ Render Functions ============

    const renderReportTabs = () => (
        <div className="flex gap-2 border-b border-slate-200 pb-4 mb-6">
            {[
                { id: 'analysis', label: 'Analysis', icon: TrendingUp },
                { id: 'car-revenue', label: 'Each Car Revenue', icon: Car },
                { id: 'farm-out', label: 'Farm Out', icon: Users },
                { id: 'company-revenue', label: 'Revenue by Company', icon: Building2 },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ReportTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const renderSettingsPanel = () => (
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Data Management</span>
                    <span className="text-sm text-slate-500">
            ({uploadedReports.length} reports uploaded)
          </span>
                </div>
                {showSettings ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {showSettings && (
                <div className="border-t border-slate-200 p-4">
                    {/* Settings Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSettingsTab('upload')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                settingsTab === 'upload'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Upload className="w-4 h-4 inline mr-1" />
                            Upload Data
                        </button>
                        <button
                            onClick={() => setSettingsTab('exchange-rates')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                settingsTab === 'exchange-rates'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Exchange Rates
                        </button>
                    </div>

                    {settingsTab === 'upload' && renderUploadSection()}
                    {settingsTab === 'exchange-rates' && renderExchangeRatesSection()}
                </div>
            )}
        </div>
    );

    const renderUploadSection = () => (
        <div className="space-y-4">
            {/* Upload Form */}
            <div className="flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                    <select
                        value={uploadYear}
                        onChange={e => setUploadYear(Number(e.target.value))}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        {AVAILABLE_YEARS.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                    <select
                        value={uploadMonth}
                        onChange={e => setUploadMonth(Number(e.target.value))}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Excel File</label>
                    <input
                        id="accounting-file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>
                <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {uploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    Upload
                </button>
            </div>

            {/* Uploaded Reports List */}
            <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Uploaded Reports</h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Period</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Transactions</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Total</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Uploaded</th>
                            <th className="px-3 py-2 text-center font-medium text-slate-600">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {uploadedReports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                                    No reports uploaded yet
                                </td>
                            </tr>
                        ) : (
                            uploadedReports.map(report => (
                                <tr key={report.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2">
                                        {report.monthName} {report.year}
                                    </td>
                                    <td className="px-3 py-2">{report.transactionCount.toLocaleString()}</td>
                                    <td className="px-3 py-2">{report.totalAmount.toLocaleString()} UZS</td>
                                    <td className="px-3 py-2 text-slate-500">
                                        {new Date(report.uploadedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleDeleteReport(report.year, report.month)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderExchangeRatesSection = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                Set USD to UZS exchange rates for each year. These are used for UZS calculations in reports.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {AVAILABLE_YEARS.map(year => {
                    const existingRate = exchangeRates.find(r => r.year === year);
                    const isEditing = editingRate?.year === year;

                    return (
                        <div key={year} className="border border-slate-200 rounded-lg p-3">
                            <div className="text-sm font-medium text-slate-700 mb-1">{year}</div>
                            {isEditing ? (
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        value={editingRate.rate}
                                        onChange={e => setEditingRate({ year, rate: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                        placeholder="Rate"
                                    />
                                    <button
                                        onClick={() => handleSaveExchangeRate(year, editingRate.rate)}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                    >
                                        ✓
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingRate({ year, rate: existingRate?.rate?.toString() || '12500' })}
                                    className="w-full text-left px-2 py-1 bg-slate-50 rounded hover:bg-slate-100 text-sm"
                                >
                                    {existingRate ? existingRate.rate.toLocaleString() : 'Set rate'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderAnalysisReport = () => {
        const isPartialYear = selectedMonths.length < 12;

        return (
            <div className="space-y-6">
                {/* Year Selection */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Select Years to Compare</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {AVAILABLE_YEARS.map(year => (
                            <button
                                key={year}
                                onClick={() => toggleYear(year)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedYears.includes(year)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    {/* Month Selection */}
                    <h3 className="text-sm font-medium text-slate-700 mb-2 mt-4">Select Months for Totals Calculation</h3>
                    <p className="text-xs text-slate-500 mb-2">All months will be displayed, but totals are calculated only for selected months.</p>
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={selectAllMonths}
                            className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearAllMonths}
                            className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {MONTHS.map((monthName, idx) => (
                            <button
                                key={idx}
                                onClick={() => toggleMonth(idx + 1)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    selectedMonths.includes(idx + 1)
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {monthName.substring(0, 3)}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerateAnalysis}
                            disabled={generatingReport || selectedYears.length < 2 || selectedMonths.length === 0}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {generatingReport ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <TrendingUp className="w-4 h-4" />
                            )}
                            Generate Report
                        </button>
                        <button
                            onClick={handleExportAnalysis}
                            disabled={selectedYears.length < 2 || selectedMonths.length === 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Analysis Report Display */}
                {analysisReport && (
                    <div className="space-y-6">
                        {/* Exchange Rates & Selected Months Info */}
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex-1">
                                <span className="text-sm font-medium text-amber-800">Exchange Rates: </span>
                                <span className="text-sm text-amber-700">
                                {analysisReport.years.map(y => `${y}: ${analysisReport.exchangeRates[y]?.toLocaleString() || 'N/A'}`).join(' | ')}
                            </span>
                            </div>
                            {isPartialYear && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <span className="text-sm font-medium text-blue-800">Selected Months: </span>
                                    <span className="text-sm text-blue-700">
                                    {analysisReport.months.map(m => MONTHS[m - 1].substring(0, 3)).join(', ')}
                                </span>
                                </div>
                            )}
                        </div>

                        {/* Monthly Revenue Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-indigo-600 text-white px-4 py-3 font-medium">
                                Monthly Revenue (UZS) — All Months
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-700">Month</th>
                                        {analysisReport.years.map(year => (
                                            <th key={year} className="px-4 py-3 text-right font-medium text-slate-700">
                                                {year}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {analysisReport.monthlyData.map(row => {
                                        const isSelected = analysisReport.months.includes(row.month);
                                        return (
                                            <tr
                                                key={row.month}
                                                className={isSelected ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50 opacity-60'}
                                            >
                                                <td className={`px-4 py-2 ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                                                    {row.monthName}
                                                    {isSelected && <span className="ml-2 text-xs text-emerald-600">✓</span>}
                                                </td>
                                                {analysisReport.years.map(year => (
                                                    <td key={year} className={`px-4 py-2 text-right ${isSelected ? 'font-medium' : 'text-slate-400'}`}>
                                                        {(row.amountsByYear[year] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}

                                    {/* Selected Months Total UZS Row */}
                                    <tr className="bg-green-50 font-bold border-t-2 border-green-200">
                                        <td className="px-4 py-3 text-slate-900">
                                            {isPartialYear ? 'SELECTED MONTHS (UZS)' : 'TOTAL (UZS)'}
                                        </td>
                                        {analysisReport.years.map(year => (
                                            <td key={year} className="px-4 py-3 text-right text-slate-900">
                                                {(analysisReport.totals.totalUzsByYear[year] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Selected Months Total USD Row */}
                                    <tr className="bg-yellow-50 font-bold">
                                        <td className="px-4 py-3 text-slate-900">
                                            {isPartialYear ? 'SELECTED MONTHS (USD)' : 'TOTAL (USD)'}
                                        </td>
                                        {analysisReport.years.map(year => (
                                            <td key={year} className="px-4 py-3 text-right text-slate-900">
                                                ${(analysisReport.totals.totalUsdByYear[year] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Full Year Totals */}
                                    {isPartialYear && analysisReport.totals.fullYearUzsByYear && (
                                        <>
                                            <tr className="bg-sky-50 font-bold">
                                                <td className="px-4 py-3 text-slate-900">FULL YEAR (UZS)</td>
                                                {analysisReport.years.map(year => (
                                                    <td key={year} className="px-4 py-3 text-right text-slate-900">
                                                        {(analysisReport.totals.fullYearUzsByYear[year] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="bg-cyan-50 font-bold">
                                                <td className="px-4 py-3 text-slate-900">FULL YEAR (USD)</td>
                                                {analysisReport.years.map(year => (
                                                    <td key={year} className="px-4 py-3 text-right text-slate-900">
                                                        ${(analysisReport.totals.fullYearUsdByYear[year] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Year-over-Year Comparison */}
                        {analysisReport.yearComparisons.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="bg-rose-600 text-white px-4 py-3 font-medium">
                                    Year-over-Year Comparison (% Change) — All Months
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-slate-700">Month</th>
                                            {analysisReport.yearComparisons.map(comp => (
                                                <th key={`${comp.baseYear}-${comp.compareYear}`} className="px-4 py-3 text-center font-medium text-slate-700">
                                                    {comp.baseYear} vs {comp.compareYear}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {MONTHS.map((monthName, idx) => {
                                            const month = idx + 1;
                                            const isSelected = analysisReport.months.includes(month);
                                            return (
                                                <tr
                                                    key={month}
                                                    className={isSelected ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50 opacity-60'}
                                                >
                                                    <td className={`px-4 py-2 ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                                                        {monthName}
                                                        {isSelected && <span className="ml-2 text-xs text-emerald-600">✓</span>}
                                                    </td>
                                                    {analysisReport.yearComparisons.map(comp => {
                                                        const change = comp.monthlyPercentageChange[month] || 0;
                                                        return (
                                                            <td
                                                                key={`${comp.baseYear}-${comp.compareYear}`}
                                                                className={`px-4 py-2 text-center font-medium ${
                                                                    isSelected
                                                                        ? change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-500'
                                                                        : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}

                                        {/* Selected Months Total Change Row */}
                                        <tr className="bg-yellow-50 font-bold border-t-2 border-yellow-200">
                                            <td className="px-4 py-3 text-slate-900">
                                                {isPartialYear ? 'SELECTED MONTHS CHANGE' : 'TOTAL CHANGE'}
                                            </td>
                                            {analysisReport.yearComparisons.map(comp => (
                                                <td
                                                    key={`${comp.baseYear}-${comp.compareYear}`}
                                                    className={`px-4 py-3 text-center ${
                                                        comp.totalPercentageChange > 0 ? 'text-green-600' : comp.totalPercentageChange < 0 ? 'text-red-600' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {comp.totalPercentageChange > 0 ? '+' : ''}{comp.totalPercentageChange.toFixed(2)}%
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Full Year Change Row */}
                                        {isPartialYear && (
                                            <tr className="bg-cyan-50 font-bold">
                                                <td className="px-4 py-3 text-slate-900">FULL YEAR CHANGE</td>
                                                {analysisReport.yearComparisons.map(comp => (
                                                    <td
                                                        key={`${comp.baseYear}-${comp.compareYear}`}
                                                        className={`px-4 py-3 text-center ${
                                                            comp.fullYearPercentageChange > 0 ? 'text-green-600' : comp.fullYearPercentageChange < 0 ? 'text-red-600' : 'text-slate-500'
                                                        }`}
                                                    >
                                                        {comp.fullYearPercentageChange > 0 ? '+' : ''}{comp.fullYearPercentageChange.toFixed(2)}%
                                                    </td>
                                                ))}
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    const renderPlaceholderTab = (title: string) => (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">{title}</h3>
            <p className="text-slate-500">This report will be implemented next.</p>
        </div>
    );

    const renderCarRevenueReport = () => (
        <div className="space-y-6">
            {/* Year and Month Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                        <select
                            value={carRevenueYear}
                            onChange={e => setCarRevenueYear(Number(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            {AVAILABLE_YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-slate-700 mb-2">Select Months</h3>
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setCarRevenueMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                        className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        Select All
                    </button>
                    <button
                        onClick={() => setCarRevenueMonths([])}
                        className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {MONTHS.map((monthName, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleCarRevenueMonth(idx + 1)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                carRevenueMonths.includes(idx + 1)
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {monthName.substring(0, 3)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateCarRevenue}
                        disabled={generatingCarRevenue || carRevenueMonths.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {generatingCarRevenue ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Car className="w-4 h-4" />
                        )}
                        Generate Report
                    </button>
                    <button
                        onClick={handleExportCarRevenue}
                        disabled={carRevenueMonths.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {carRevenueReport && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-600 text-white px-4 py-3 font-medium flex justify-between items-center">
                        <span>Car Revenue Report - {carRevenueReport.year}</span>
                        <span className="text-sm opacity-80">
            {carRevenueReport.rows.length} vehicles | Exchange Rate: {carRevenueReport.exchangeRate.toLocaleString()} UZS/USD
          </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-3 text-left font-medium text-slate-700 sticky left-0 bg-slate-50">Car</th>
                                <th className="px-3 py-3 text-left font-medium text-slate-700">Category</th>
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Total ({carRevenueReport.months.length}m)</th>
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Avg UZS</th>
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Avg USD</th>
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Cost USD</th>
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Plan USD</th>
                                {carRevenueReport.monthNames.map((name, idx) => (
                                    <th key={idx} className="px-3 py-3 text-right font-medium text-slate-700">{name}</th>
                                ))}
                                <th className="px-3 py-3 text-right font-medium text-slate-700">Portion</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {carRevenueReport.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-medium text-slate-900 sticky left-0 bg-white">{row.car}</td>
                                    <td className="px-3 py-2 text-slate-600">{row.category}</td>
                                    <td className="px-3 py-2 text-right">{row.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-3 py-2 text-right">{row.averageUzs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-3 py-2 text-right">${row.averageUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-3 py-2 text-right">{row.carCostUsd > 0 ? `$${row.carCostUsd.toLocaleString()}` : '-'}</td>
                                    <td className="px-3 py-2 text-right">
                                        {row.planUsd > 0 ? (
                                            <span className={row.averageUsd >= row.planUsd ? 'text-green-600' : 'text-red-600'}>
                        ${row.planUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                                        ) : '-'}
                                    </td>
                                    {carRevenueReport.months.map(month => (
                                        <td key={month} className="px-3 py-2 text-right">
                                            {(row.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 text-right font-medium">{row.portionPercent.toFixed(2)}%</td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-yellow-50 font-bold">
                                <td className="px-3 py-3 text-slate-900 sticky left-0 bg-yellow-50">TOTAL</td>
                                <td className="px-3 py-3"></td>
                                <td className="px-3 py-3 text-right">{carRevenueReport.totals.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-3 py-3 text-right">{carRevenueReport.totals.averageUzs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-3 py-3 text-right">${carRevenueReport.totals.averageUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-3 py-3 text-right">${carRevenueReport.totals.totalCarCostUsd.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right">${carRevenueReport.totals.totalPlanUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                {carRevenueReport.months.map(month => (
                                    <td key={month} className="px-3 py-3 text-right">
                                        {(carRevenueReport.totals.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                ))}
                                <td className="px-3 py-3 text-right">100%</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderFarmOutReport = () => (
        <div className="space-y-6">
            {/* Year and Month Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                        <select
                            value={farmOutYear}
                            onChange={e => setFarmOutYear(Number(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            {AVAILABLE_YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-slate-700 mb-2">Select Months</h3>
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setFarmOutMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                        className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        Select All
                    </button>
                    <button
                        onClick={() => setFarmOutMonths([])}
                        className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {MONTHS.map((monthName, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleFarmOutMonth(idx + 1)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                farmOutMonths.includes(idx + 1)
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {monthName.substring(0, 3)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateFarmOut}
                        disabled={generatingFarmOut || farmOutMonths.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {generatingFarmOut ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Users className="w-4 h-4" />
                        )}
                        Generate Report
                    </button>
                    <button
                        onClick={handleExportFarmOut}
                        disabled={farmOutMonths.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {farmOutReport && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-orange-600 text-white px-4 py-3 font-medium flex justify-between items-center">
                        <span>Farm Out Report - {farmOutReport.year}</span>
                        <span className="text-sm opacity-80">
            {farmOutReport.rows.length} vehicle types | Exchange Rate: {farmOutReport.exchangeRate.toLocaleString()} UZS/USD
          </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-700 sticky left-0 bg-slate-50">Car Type</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-700">Total (UZS)</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-700">Total (USD)</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-700">Car Cost (USD)</th>
                                {farmOutReport.monthNames.map((name, idx) => (
                                    <th key={idx} className="px-4 py-3 text-right font-medium text-slate-700">{name}</th>
                                ))}
                                <th className="px-4 py-3 text-right font-medium text-slate-700">Portion</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {farmOutReport.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">{row.carType}</td>
                                    <td className="px-4 py-3 text-right">{row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 text-right">${row.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-3 text-right">{row.carCostUsd > 0 ? `$${row.carCostUsd.toLocaleString()}` : '-'}</td>
                                    {farmOutReport.months.map(month => (
                                        <td key={month} className="px-4 py-3 text-right">
                                            {(row.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right font-medium">{row.portionPercent.toFixed(2)}%</td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-yellow-50 font-bold">
                                <td className="px-4 py-3 text-slate-900 sticky left-0 bg-yellow-50">TOTAL</td>
                                <td className="px-4 py-3 text-right">{farmOutReport.totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-4 py-3 text-right">${farmOutReport.totals.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right">${farmOutReport.totals.totalCarCostUsd.toLocaleString()}</td>
                                {farmOutReport.months.map(month => (
                                    <td key={month} className="px-4 py-3 text-right">
                                        {(farmOutReport.totals.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right">100%</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );


    const renderCompanyRevenueReport = () => (
        <div className="space-y-6">
            {/* Year and Month Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                        <select
                            value={companyRevenueYear}
                            onChange={e => setCompanyRevenueYear(Number(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            {AVAILABLE_YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-slate-700 mb-2">Select Months</h3>
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setCompanyRevenueMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                        className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        Select All
                    </button>
                    <button
                        onClick={() => setCompanyRevenueMonths([])}
                        className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {MONTHS.map((monthName, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleCompanyRevenueMonth(idx + 1)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                companyRevenueMonths.includes(idx + 1)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {monthName.substring(0, 3)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateCompanyRevenue}
                        disabled={generatingCompanyRevenue || companyRevenueMonths.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {generatingCompanyRevenue ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Building2 className="w-4 h-4" />
                        )}
                        Generate Report
                    </button>
                    <button
                        onClick={handleExportCompanyRevenue}
                        disabled={companyRevenueMonths.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Report Display */}
            {companyRevenueReport && (
                <>
                    {/* Category Analysis */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-purple-600 text-white px-4 py-3 font-medium">
                            Category Analysis - {companyRevenueReport.year}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-700">Revenue (UZS)</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-700">Companies</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-700">Portion</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {companyRevenueReport.categoryAnalysis.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{row.categoryName}</td>
                                        <td className="px-4 py-3 text-right">{row.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-3 text-right">{row.companyCount}</td>
                                        <td className="px-4 py-3 text-right font-medium">{row.portionPercent.toFixed(2)}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-yellow-50 font-bold">
                                    <td className="px-4 py-3 text-slate-900">TOTAL</td>
                                    <td className="px-4 py-3 text-right">{companyRevenueReport.totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 text-right">{companyRevenueReport.companyRows.length}</td>
                                    <td className="px-4 py-3 text-right">100%</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-indigo-600 text-white px-4 py-3 font-medium flex justify-between items-center">
                            <span>Company Details - {companyRevenueReport.year}</span>
                            <span className="text-sm opacity-80">{companyRevenueReport.companyRows.length} companies</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700 sticky left-0 bg-slate-50">Company</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-700">Total (UZS)</th>
                                    <th className="px-4 py-3 text-right font-medium text-slate-700">Portion</th>
                                    {companyRevenueReport.monthNames.map((name, idx) => (
                                        <th key={idx} className="px-4 py-3 text-right font-medium text-slate-700">{name}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {companyRevenueReport.companyRows.slice(0, 50).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">{row.companyName}</td>
                                        <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                          row.categoryName === 'Uncategorized'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                      }`}>
                        {row.categoryName}
                      </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">{row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-4 py-3 text-right font-medium">{row.portionPercent.toFixed(2)}%</td>
                                        {companyRevenueReport.months.map(month => (
                                            <td key={month} className="px-4 py-3 text-right">
                                                {(row.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {companyRevenueReport.companyRows.length > 50 && (
                                    <tr>
                                        <td colSpan={4 + companyRevenueReport.months.length} className="px-4 py-3 text-center text-slate-500">
                                            Showing top 50 companies. Export to Excel to see all {companyRevenueReport.companyRows.length} companies.
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-yellow-50 font-bold">
                                    <td className="px-4 py-3 text-slate-900 sticky left-0 bg-yellow-50">TOTAL</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right">{companyRevenueReport.totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 text-right">100%</td>
                                    {companyRevenueReport.months.map(month => (
                                        <td key={month} className="px-4 py-3 text-right">
                                            {(companyRevenueReport.totals.monthlyAmounts[month] || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                    ))}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Accounting Reports</h1>
                <p className="text-slate-500">Generate and export financial reports</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                    <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
                </div>
            )}

            {/* Settings Panel (Upload & Exchange Rates) */}
            {renderSettingsPanel()}

            {/* Report Tabs */}
            {renderReportTabs()}

            {/* Report Content */}
            {activeTab === 'analysis' && renderAnalysisReport()}
            {activeTab === 'car-revenue' && renderCarRevenueReport()}
            {activeTab === 'farm-out' && renderFarmOutReport()}
            {activeTab === 'company-revenue' && renderCompanyRevenueReport()}
        </div>
    );
}
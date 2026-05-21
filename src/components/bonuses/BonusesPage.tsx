import React, { useState, useEffect } from 'react';
import {
    Calculator, Download, Loader2, ChevronDown, ChevronUp,
    Clock, Car, Users, DollarSign
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';
import {
    calculateBonuses,
    exportBonusesToExcel,
    BonusCalculationResultDto,
    DriverBonusResultDto
} from '@/services/bonusService';

interface ReportPeriod {
    id: number;
    startDate: string;
    endDate: string;
    description: string | null;
}

export function BonusesPage() {
    const { token } = useAuth();

    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [selectedPeriodIds, setSelectedPeriodIds] = useState<number[]>([]);
    const [result, setResult] = useState<BonusCalculationResultDto | null>(null);
    const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPeriods();
    }, [token]);

    const loadPeriods = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/report-periods`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPeriods(data.data || []);
            }
        } catch (err) {
            setError('Failed to load periods');
        } finally {
            setLoading(false);
        }
    };

    const togglePeriod = (periodId: number) => {
        setSelectedPeriodIds(prev =>
            prev.includes(periodId)
                ? prev.filter(id => id !== periodId)
                : [...prev, periodId]
        );
    };

    const handleCalculate = async () => {
        if (!token || selectedPeriodIds.length === 0) return;

        setCalculating(true);
        setError(null);
        setResult(null);

        try {
            const data = await calculateBonuses({ periodIds: selectedPeriodIds }, token);
            setResult(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setCalculating(false);
        }
    };

    const handleExport = async () => {
        if (!token || selectedPeriodIds.length === 0) return;

        setExporting(true);
        try {
            const blob = await exportBonusesToExcel({ periodIds: selectedPeriodIds }, token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Bonuses_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to export');
        } finally {
            setExporting(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-US');
    };

    const formatCurrency = (num: number) => {
        return num.toLocaleString('en-US');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Driver Bonuses</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Calculate and view bonus payments for drivers
                    </p>
                </div>
            </div>

            {/* Period Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Report Periods</h2>

                {periods.length === 0 ? (
                    <p className="text-slate-500">No report periods found</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {periods.map(period => (
                            <label
                                key={period.id}
                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedPeriodIds.includes(period.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPeriodIds.includes(period.id)}
                                    onChange={() => togglePeriod(period.id)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <div className="font-medium text-slate-900">
                                        {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                    </div>
                                    {period.description && (
                                        <div className="text-sm text-slate-500">{period.description}</div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleCalculate}
                        disabled={calculating || selectedPeriodIds.length === 0}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {calculating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Calculator className="w-4 h-4" />
                        )}
                        Calculate Bonuses
                    </button>

                    {result && (
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                        >
                            {exporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Export to Excel
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-sm">Grand Total</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatCurrency(result.grandTotal)}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Drivers</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {result.totalDrivers}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Car className="w-4 h-4" />
                                <span className="text-sm">Total Trips</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatNumber(result.totalTrips)}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Total Hours</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatNumber(Math.round(result.totalHoursWorked))}
                            </div>
                        </div>
                    </div>

                    {/* Period Info */}
                    <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-600">
                        <span className="font-medium">Period:</span> {result.periodNames}
                    </div>

                    {/* Driver Results */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Driver Breakdown</h2>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {result.driverResults.map((driver, index) => (
                                <DriverResultRow
                                    key={driver.driverName}
                                    driver={driver}
                                    rank={index + 1}
                                    isExpanded={expandedDriver === driver.driverName}
                                    onToggle={() => setExpandedDriver(
                                        expandedDriver === driver.driverName ? null : driver.driverName
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface DriverResultRowProps {
    driver: DriverBonusResultDto;
    rank: number;
    isExpanded: boolean;
    onToggle: () => void;
}

function DriverResultRow({ driver, rank, isExpanded, onToggle }: DriverResultRowProps) {
    const formatCurrency = (num: number) => num.toLocaleString('en-US');

    return (
        <div>
            {/* Main Row */}
            <div
                onClick={onToggle}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {rank}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{driver.driverName}</div>
                    <div className="text-sm text-slate-500">
                        {driver.totalTrips} trips • {driver.totalDaysWorked} days • {driver.totalHoursWorked.toFixed(1)} hours
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                        {formatCurrency(driver.totalBonus)}
                    </div>
                    <div className="text-xs text-slate-500">
                        ~{formatCurrency(Math.round(driver.totalBonus / driver.totalTrips))}/trip
                    </div>
                </div>

                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-6 pb-4 bg-slate-50">
                    {/* Service Type Breakdown */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">By Service Type</h4>
                        <div className="space-y-2">
                            {driver.serviceTypeBreakdowns.map(breakdown => (
                                <div
                                    key={breakdown.serviceTypeName}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                >
                                    <div>
                                        <div className="font-medium text-slate-900">{breakdown.serviceTypeName}</div>
                                        <div className="text-xs text-slate-500">
                                            {breakdown.calculationMethod} • {breakdown.tripCount} trips • {breakdown.totalHours.toFixed(1)}h
                                            {breakdown.totalDays > 0 && ` • ${breakdown.totalDays} days`}
                                        </div>
                                        {(breakdown.premiumVehicleTrips > 0 || breakdown.standardVehicleTrips > 0) && (
                                            <div className="text-xs text-slate-400 mt-1">
                                                Premium: {breakdown.premiumVehicleTrips} • Standard: {breakdown.standardVehicleTrips}
                                            </div>
                                        )}
                                        {(breakdown.tripsUnder2Hours > 0 || breakdown.tripsUnder4Hours > 0 ||
                                            breakdown.trips4To6Hours > 0 || breakdown.trips6To8Hours > 0 ||
                                            breakdown.trips8To10Hours > 0 || breakdown.trips10To12Hours > 0 ||
                                            breakdown.trips12To14Hours > 0 || breakdown.tripsOver14Hours > 0) && (
                                            <div className="text-xs text-slate-400 mt-1">
                                                &lt;2h: {breakdown.tripsUnder2Hours} •
                                                2-4h: {breakdown.tripsUnder4Hours} •
                                                4-6h: {breakdown.trips4To6Hours} •
                                                6-8h: {breakdown.trips6To8Hours} •
                                                8-10h: {breakdown.trips8To10Hours} •
                                                10-12h: {breakdown.trips10To12Hours} •
                                                12-14h: {breakdown.trips12To14Hours} •
                                                &gt;14h: {breakdown.tripsOver14Hours}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-lg font-semibold text-green-600">
                                        {formatCurrency(breakdown.bonusAmount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        {driver.longestTrip && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Longest Trip</div>
                                <div className="text-sm font-semibold text-slate-900">
                                    {driver.longestTrip.durationHours.toFixed(1)} hours
                                </div>
                                <div className="text-xs text-slate-500">
                                    {driver.longestTrip.serviceTypeName} • {new Date(driver.longestTrip.date).toLocaleDateString()}
                                </div>
                            </div>
                        )}

                        {driver.furthestTrip && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Furthest Trip</div>
                                <div className="text-sm font-semibold text-slate-900">
                                    {driver.furthestTrip.distanceKm.toFixed(1)} km
                                </div>
                                <div className="text-xs text-slate-500">
                                    {driver.furthestTrip.serviceTypeName} • {new Date(driver.furthestTrip.date).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

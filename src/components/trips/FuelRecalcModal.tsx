import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
    recalculateVehicleFuel,
    FuelRecalculationResponse,
    FuelViolationDto
} from '@/services/fuelService';

interface FuelRecalcModalProps {
    periodId: number;
    vehicleId: number;
    plateNumber: string;
    preview: FuelRecalculationResponse;
    token: string;
    onClose: () => void;
}

function formatLiters(value: number) {
    return `${value.toFixed(2)} L`;
}

function formatCost(value: number) {
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatViolations(violations: FuelViolationDto[]) {
    return violations
        .map(v => `${new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${v.kind} (${v.level.toFixed(1)} L)`)
        .join(', ');
}

function BeforeAfter({ before, after }: { before: string; after: string }) {
    return (
        <span className="whitespace-nowrap">
            <span className="text-slate-500">{before}</span>
            <span className="mx-1 text-slate-400">→</span>
            <span className={before === after ? 'text-slate-700' : 'font-medium text-slate-900'}>{after}</span>
        </span>
    );
}

export function FuelRecalcModal({ periodId, vehicleId, plateNumber, preview, token, onClose }: FuelRecalcModalProps) {
    const [result, setResult] = useState<FuelRecalculationResponse>(preview);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applied = result.data.saved;
    const vehicle = result.data.vehicles[0];

    const handleApply = async () => {
        setApplying(true);
        setError(null);
        try {
            setResult(await recalculateVehicleFuel(periodId, vehicleId, token));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Recalculate fuel</h2>
                        <p className="text-sm text-slate-500">
                            Recalculates fuel for vehicle <span className="font-mono">{plateNumber}</span> for
                            the whole period, not just this trip.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div
                        className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                            applied
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                    >
                        {applied && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                        <span>{applied ? result.message : `Preview (nothing saved yet): ${result.message}`}</span>
                    </div>

                    {vehicle && (
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2 text-slate-500">Liters</td>
                                    <td className="py-2 text-right">
                                        <BeforeAfter before={formatLiters(vehicle.litersBefore)} after={formatLiters(vehicle.litersAfter)} />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 text-slate-500">Cost</td>
                                    <td className="py-2 text-right">
                                        <BeforeAfter before={formatCost(vehicle.costBefore)} after={formatCost(vehicle.costAfter)} />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 text-slate-500">Ending level</td>
                                    <td className="py-2 text-right">
                                        <BeforeAfter before={formatLiters(vehicle.endingLevelBefore)} after={formatLiters(vehicle.endingLevelAfter)} />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 text-slate-500 align-top">Problem days before</td>
                                    <td className="py-2 text-right text-slate-700">
                                        {vehicle.violationsBefore.length > 0 ? formatViolations(vehicle.violationsBefore) : 'None'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 text-slate-500 align-top">Problem days after</td>
                                    <td className="py-2 text-right">
                                        {vehicle.violationsAfter.length > 0 ? (
                                            <span className="text-red-600">{formatViolations(vehicle.violationsAfter)}</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <CheckCircle2 className="w-4 h-4" /> None
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}

                    {result.data.warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm space-y-1">
                            {result.data.warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{w}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {applied ? 'Close' : 'Cancel'}
                    </button>
                    {!applied && (
                        <button
                            onClick={handleApply}
                            disabled={applying || !vehicle}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center justify-center gap-2"
                        >
                            {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

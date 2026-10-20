import React, { useState, useEffect } from 'react';
import { Save, Loader2, RefreshCw, Gauge, Lock } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Permissions, usePermission } from '@/auth/PermissionComponents';
import {
    getFuelSettings,
    updateFuelSettings,
    FuelSettingsDto,
    MAX_DURATION_FALLBACK_SPEED_KMH
} from '@/services/fuelService';

export function FuelSettingsPage() {
    const { token } = useAuth();
    const canEdit = usePermission(Permissions.Gas.Manage);

    const [settings, setSettings] = useState<FuelSettingsDto | null>(null);
    const [speed, setSpeed] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);

        try {
            const data = await getFuelSettings(token);
            setSettings(data);
            setSpeed(data.durationFallbackSpeedKmh.toString());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const speedValue = parseFloat(speed);
    const isSpeedValid = !isNaN(speedValue) && speedValue > 0 && speedValue <= MAX_DURATION_FALLBACK_SPEED_KMH;
    const isDirty = settings !== null && speedValue !== settings.durationFallbackSpeedKmh;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !canEdit) return;

        if (!isSpeedValid) {
            setError(`Speed must be greater than 0 and at most ${MAX_DURATION_FALLBACK_SPEED_KMH} km/h`);
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const updated = await updateFuelSettings({ durationFallbackSpeedKmh: speedValue }, token);
            setSettings(updated);
            setSpeed(updated.durationFallbackSpeedKmh.toString());
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Fuel Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure how trip distance and fuel consumption are calculated
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {successMessage}
                </div>
            )}

            {settings && (
                <div className="space-y-6">
                    {/* Fallback speed */}
                    <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Gauge className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Distance Fallback Speed</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Assumed average speed used to estimate a trip&apos;s distance from its duration when
                            routing returns nothing. For Custom Itinerary trips it is also the minimum distance.
                        </p>

                        <div className="flex items-end gap-3">
                            <div className="max-w-xs flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Average speed (km/h)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    max={MAX_DURATION_FALLBACK_SPEED_KMH}
                                    value={speed}
                                    onChange={e => setSpeed(e.target.value)}
                                    disabled={!canEdit || saving}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                            {canEdit && (
                                <button
                                    type="submit"
                                    disabled={saving || !isDirty}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                            )}
                        </div>

                        {isSpeedValid && (
                            <p className="text-xs text-slate-500 mt-2">
                                Example: a 2-hour trip with no route is counted as {Number((speedValue * 2).toFixed(1))} km.
                            </p>
                        )}

                        {!canEdit && (
                            <p className="flex items-center gap-1 text-xs text-amber-700 mt-2">
                                <Lock className="w-3 h-3" />
                                You have view-only access to this setting.
                            </p>
                        )}

                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700">
                                <strong>Note:</strong> A change applies only to distances calculated afterwards. Existing
                                trips keep their stored distance until it is recalculated or the trips are re-uploaded.
                            </p>
                        </div>

                        <p className="text-xs text-slate-400 mt-3">
                            Last updated: {new Date(settings.updatedAt).toLocaleString()}
                        </p>
                    </form>
                </div>
            )}
        </div>
    );
}

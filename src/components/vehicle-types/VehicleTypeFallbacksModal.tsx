import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus, Loader2, Layers } from 'lucide-react';

import {
    getAllVehicleTypes,
    getVehicleTypeFallbacks,
    updateVehicleTypeFallbacks,
} from '@/services/vehicleTypeService';
import { useAuth } from '@/auth/AuthContext';
import { ModalShell } from '@/components/ModalShell';

interface VehicleTypeOption {
    id: number;
    name: string;
}

interface VehicleTypeFallbacksModalProps {
    vehicleType: { id: string; name: string } | null;
    onClose: () => void;
    onSaved?: () => void;
}

export function VehicleTypeFallbacksModal({ vehicleType, onClose, onSaved }: VehicleTypeFallbacksModalProps) {
    const { token } = useAuth();

    const [allTypes, setAllTypes] = useState<VehicleTypeOption[]>([]);
    const [fallbacks, setFallbacks] = useState<VehicleTypeOption[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!vehicleType) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            setSelectedToAdd('');
            try {
                const [types, current] = await Promise.all([
                    getAllVehicleTypes(token!, 1, 1000),
                    getVehicleTypeFallbacks(token!, Number(vehicleType.id)),
                ]);
                setAllTypes(types.map(t => ({ id: Number(t.id), name: t.name })));
                setFallbacks(
                    [...current]
                        .sort((a, b) => a.priority - b.priority)
                        .map(f => ({ id: f.vehicleTypeId, name: f.name }))
                );
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load fallback vehicle types');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [vehicleType]);

    if (!vehicleType) return null;

    // Don't offer the type itself or types already in the list
    const availableTypes = allTypes.filter(
        t => t.id !== Number(vehicleType.id) && !fallbacks.some(f => f.id === t.id)
    );

    const handleAdd = () => {
        const type = availableTypes.find(t => t.id === Number(selectedToAdd));
        if (!type) return;
        setFallbacks([...fallbacks, type]);
        setSelectedToAdd('');
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= fallbacks.length) return;
        const next = [...fallbacks];
        [next[index], next[target]] = [next[target], next[index]];
        setFallbacks(next);
    };

    const handleRemove = (index: number) => {
        setFallbacks(fallbacks.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateVehicleTypeFallbacks(token!, Number(vehicleType.id), fallbacks.map(f => f.id));
            onSaved?.();
            onClose();
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.errors?.join(', ') || data?.message || 'Failed to save fallback vehicle types');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell onClose={onClose} title="Vehicle type fallbacks" className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-500" />
                            Fallbacks - {vehicleType.name}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Used by Resolve Conflicts, tried in order from top to bottom.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <>
                            {fallbacks.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-sm">
                                    No fallback vehicle types configured.
                                </div>
                            ) : (
                                <ol className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                                    {fallbacks.map((f, index) => (
                                        <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <span className="w-6 text-sm text-slate-400">{index + 1}.</span>
                                            <span className="flex-1 font-medium text-slate-900">{f.name}</span>
                                            <button
                                                onClick={() => handleMove(index, -1)}
                                                disabled={index === 0}
                                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move up"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMove(index, 1)}
                                                disabled={index === fallbacks.length - 1}
                                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move down"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                title="Remove"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            )}

                            <div className="flex gap-2">
                                <select
                                    value={selectedToAdd}
                                    onChange={e => setSelectedToAdd(e.target.value)}
                                    disabled={availableTypes.length === 0}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {availableTypes.length === 0 ? 'No more types to add' : 'Select a vehicle type...'}
                                    </option>
                                    {availableTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAdd}
                                    disabled={!selectedToAdd}
                                    className="flex items-center gap-1.5 px-3 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </button>
                </div>
            </ModalShell>
    );
}

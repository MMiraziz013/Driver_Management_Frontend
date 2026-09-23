import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Switch } from '@/components/ui/switch';
import { BonusExceptionModal } from './BonusExceptionModal';
import { getAllVehicleTypes } from '@/services/vehicleTypeService';
import {
    getBonusExceptions,
    updateBonusException,
    deleteBonusException,
    BonusCalculationExceptionDto,
    ServiceTypeBonusConfigDto,
} from '@/services/bonusService';

interface BonusExceptionsSectionProps {
    serviceTypeConfigs: ServiceTypeBonusConfigDto[];
}

export function BonusExceptionsSection({ serviceTypeConfigs }: BonusExceptionsSectionProps) {
    const { token } = useAuth();

    const [exceptions, setExceptions] = useState<BonusCalculationExceptionDto[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // undefined = modal closed, null = create, object = edit
    const [editing, setEditing] = useState<BonusCalculationExceptionDto | null | undefined>(undefined);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadExceptions();
        if (token) {
            getAllVehicleTypes(token, 1, 1000)
                .then(setVehicleTypes)
                .catch(err => console.error('Error fetching vehicle types:', err));
        }
    }, [token]);

    const loadExceptions = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            setExceptions(await getBonusExceptions(token));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // PUT is a full replace, so send every field with the new isActive
    const handleToggleActive = async (exception: BonusCalculationExceptionDto, isActive: boolean) => {
        if (!token) return;
        setTogglingId(exception.id);
        setError(null);
        try {
            const updated = await updateBonusException(exception.id, {
                name: exception.name,
                isActive,
                companyNameContains: exception.companyNameContains,
                serviceTypeId: exception.serviceTypeId,
                calculationMethod: exception.calculationMethod,
                vehicleTypes: exception.vehicleTypes,
                locationKeywords: exception.locationKeywords,
            }, token);
            setExceptions(prev => prev.map(e => e.id === exception.id ? (updated ?? { ...e, isActive }) : e));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!token) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteBonusException(id, token);
            setExceptions(prev => prev.filter(e => e.id !== id));
            setDeleteId(null);
        } catch (err) {
            setError((err as Error).message);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const serviceTypes = serviceTypeConfigs.map(c => ({ id: c.serviceTypeId, name: c.serviceTypeName }));

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Calculation Exceptions</h2>
                </div>
                <button
                    onClick={() => setEditing(null)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Exception
                </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
                Override the calculation method for specific trips, e.g. Sierra Nevada Round Trips via Chirchik as hourly.
                Matched trips show as a separate row in bonus results. Changes here save immediately.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
            ) : exceptions.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
                    No exceptions yet. All trips use their service type&apos;s calculation method.
                </div>
            ) : (
                <div className="space-y-3">
                    {exceptions.map(exception => (
                        <div
                            key={exception.id}
                            className={`flex items-start gap-4 p-4 bg-slate-50 rounded-lg ${exception.isActive ? '' : 'opacity-60'}`}
                        >
                            <Switch
                                className="mt-1"
                                checked={exception.isActive}
                                disabled={togglingId === exception.id}
                                onCheckedChange={checked => handleToggleActive(exception, checked)}
                                title={exception.isActive ? 'Active' : 'Inactive'}
                            />
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-slate-900">{exception.name}</span>
                                    {!exception.isActive && (
                                        <span className="text-xs text-slate-500">(inactive)</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600">
                                    <span className="font-medium">{exception.serviceTypeName}</span> trips for companies containing{' '}
                                    <span className="font-medium">&ldquo;{exception.companyNameContains}&rdquo;</span> are calculated as{' '}
                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                        {exception.calculationMethodName || exception.calculationMethod}
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                                    <span>
                                        Vehicles:{' '}
                                        {exception.vehicleTypes.length === 0
                                            ? <em>All vehicle types</em>
                                            : exception.vehicleTypes.join(', ')}
                                    </span>
                                    <span>
                                        Route:{' '}
                                        {exception.locationKeywords.length === 0
                                            ? <em>Any route</em>
                                            : exception.locationKeywords.join(', ')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setEditing(exception)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteId(exception.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Exception</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure? Matching trips will be calculated with their service type&apos;s normal method again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center gap-2"
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BonusExceptionModal
                isOpen={editing !== undefined}
                exception={editing ?? null}
                serviceTypes={serviceTypes}
                vehicleTypes={vehicleTypes}
                onClose={() => setEditing(undefined)}
                onSuccess={loadExceptions}
            />
        </div>
    );
}

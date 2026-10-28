import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2, Search, Edit2, Calculator, Trash2, Filter, Fuel, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
    getReportPeriods,
    getTripsByPeriod,
    getTripById,
    recalculateTripDistance,
    deleteTrip,
    TripDto,
    ReportPeriodSummary
} from '@/services/tripService';
import { previewVehicleFuelRecalculation, FuelRecalculationResponse } from '@/services/fuelService';
import { EditTripModal } from './EditTripModal';
import { FuelRecalcModal } from './FuelRecalcModal';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

const PERIOD_STORAGE_KEY = 'trips.selectedPeriodId';

function readStoredPeriodId(): number | null {
    try {
        const value = localStorage.getItem(PERIOD_STORAGE_KEY);
        return value ? Number(value) : null;
    } catch {
        return null;
    }
}

function storePeriodId(id: number) {
    try {
        localStorage.setItem(PERIOD_STORAGE_KEY, String(id));
    } catch {
        // Storage unavailable (private mode etc.); the default period is used next time
    }
}

type SortKey = 'date' | 'distance' | 'idle';
type SortState = { key: SortKey; dir: 'asc' | 'desc' } | null;

function sortValue(trip: TripDto, key: SortKey): string | number | null {
    switch (key) {
        case 'date':
            return `${trip.pickUpDate.substring(0, 10)} ${trip.garageOutTime}`;
        case 'distance':
            return trip.distanceKm;
        case 'idle':
            return trip.drivingDurationHours != null ? trip.idleHours : null;
    }
}

function SortableHeader({ label, sortKey, sort, onSort, align = 'left' }: {
    label: string;
    sortKey: SortKey;
    sort: SortState;
    onSort: (key: SortKey) => void;
    align?: 'left' | 'right';
}) {
    const active = sort?.key === sortKey;
    const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <th
            className={`px-4 py-3 font-semibold text-slate-700 ${align === 'right' ? 'text-right' : 'text-left'}`}
            aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            <button
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 hover:text-indigo-600 ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
                {label}
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
            </button>
        </th>
    );
}

// Shows the assigned value, with the imported one in the tooltip; falls back to the imported value
function AssignedCell({ assigned, imported, className }: {
    assigned?: string | null;
    imported: string | null;
    className: string;
}) {
    if (assigned) {
        return (
            <td className={className} title={imported && imported !== assigned ? `Imported: ${imported}` : undefined}>
                {assigned}
            </td>
        );
    }
    return (
        <td className={`${className} !text-slate-400`} title={imported ? 'Imported value; not assigned' : undefined}>
            {imported || '-'}
        </td>
    );
}

export function TripsPage() {
    const confirm = useConfirm();
    const { token } = useAuth();

    const [periods, setPeriods] = useState<ReportPeriodSummary[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
    const [trips, setTrips] = useState<TripDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterUnresolved, setFilterUnresolved] = useState(false);
    const [sort, setSort] = useState<SortState>(null);

    const [editingTrip, setEditingTrip] = useState<TripDto | null>(null);
    const [recalculatingId, setRecalculatingId] = useState<number | null>(null);
    const [recalculatingFuelId, setRecalculatingFuelId] = useState<number | null>(null);
    const [fuelPreview, setFuelPreview] = useState<{
        periodId: number;
        vehicleId: number;
        plateNumber: string;
        preview: FuelRecalculationResponse;
    } | null>(null);

    // Load periods on mount
    useEffect(() => {
        async function loadPeriods() {
            if (!token) return;
            try {
                const data = await getReportPeriods(token);
                setPeriods(data);
                if (data.length > 0) {
                    const storedId = readStoredPeriodId();
                    setSelectedPeriodId(data.some(p => p.id === storedId) ? storedId : data[0].id);
                }
            } catch (err) {
                setError('Failed to load report periods');
            } finally {
                setLoading(false);
            }
        }
        loadPeriods();
    }, [token]);

    // Load trips when period changes
    useEffect(() => {
        async function loadTrips() {
            if (!token || !selectedPeriodId) return;
            setTripsLoading(true);
            try {
                const data = await getTripsByPeriod(selectedPeriodId, token);
                setTrips(data);
                setError(null);
            } catch (err) {
                setError('Failed to load trips');
            } finally {
                setTripsLoading(false);
            }
        }
        loadTrips();
    }, [token, selectedPeriodId]);

    // Wait for typing to pause before filtering
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter and sort trips
    const filteredTrips = useMemo(() => {
        let result = trips;

        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase();
            result = result.filter(t =>
                t.confNumber.toLowerCase().includes(term) ||
                t.companyName.toLowerCase().includes(term) ||
                t.routingDetails.toLowerCase().includes(term) ||
                (t.importedDriverName?.toLowerCase().includes(term)) ||
                (t.importedVehiclePlate?.toLowerCase().includes(term)) ||
                (t.assignedDriverName?.toLowerCase().includes(term)) ||
                (t.assignedVehiclePlate?.toLowerCase().includes(term))
            );
        }

        if (filterUnresolved) {
            result = result.filter(t => !t.coordinatesResolved);
        }

        if (sort) {
            const factor = sort.dir === 'asc' ? 1 : -1;
            result = [...result].sort((a, b) => {
                const av = sortValue(a, sort.key);
                const bv = sortValue(b, sort.key);
                // Missing values always go last
                if (av === null) return bv === null ? 0 : 1;
                if (bv === null) return -1;
                return (av < bv ? -1 : av > bv ? 1 : 0) * factor;
            });
        }

        return result;
    }, [trips, debouncedSearch, filterUnresolved, sort]);

    // Click cycles ascending -> descending -> original order
    const handleSort = (key: SortKey) => {
        setSort(prev => {
            if (prev?.key !== key) return { key, dir: 'asc' };
            return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
        });
    };

    const handleRefresh = useCallback(async () => {
        if (!token || !selectedPeriodId) return;
        setTripsLoading(true);
        try {
            const data = await getTripsByPeriod(selectedPeriodId, token);
            setTrips(data);
        } catch (err) {
            setError('Failed to refresh trips');
        } finally {
            setTripsLoading(false);
        }
    }, [token, selectedPeriodId]);

    const handleRecalculateDistance = async (tripId: number) => {
        if (!token) return;
        setRecalculatingId(tripId);
        try {
            const newDistance = await recalculateTripDistance(tripId, token);
            try {
                // Re-fetch the trip: idle hours change together with the distance
                const updated = await getTripById(tripId, token);
                setTrips(prev => prev.map(t => t.id === tripId ? updated : t));
            } catch {
                setTrips(prev => prev.map(t =>
                    t.id === tripId
                        ? { ...t, distanceKm: newDistance, coordinatesResolved: newDistance !== null }
                        : t
                ));
                handleRefresh();
            }
        } catch (err) {
            toast.error('Failed to recalculate distance: ' + (err as Error).message);
        } finally {
            setRecalculatingId(null);
        }
    };

    const handleRecalculateFuel = async (trip: TripDto) => {
        if (!token || !selectedPeriodId || trip.assignedVehicleId == null) return;
        const vehicleId = trip.assignedVehicleId;
        setRecalculatingFuelId(trip.id);
        try {
            const preview = await previewVehicleFuelRecalculation(selectedPeriodId, vehicleId, token);
            setFuelPreview({
                periodId: selectedPeriodId,
                vehicleId,
                plateNumber: trip.assignedVehiclePlate ?? String(vehicleId),
                preview,
            });
        } catch (err) {
            toast.error('Failed to recalculate fuel: ' + (err as Error).message);
        } finally {
            setRecalculatingFuelId(null);
        }
    };

    const handleDeleteTrip = async (tripId: number) => {
        if (!token) return;
        if (!(await confirm({ title: 'Delete this trip?', description: 'This cannot be undone.', destructive: true }))) return;

        try {
            await deleteTrip(tripId, token);
            setTrips(prev => prev.filter(t => t.id !== tripId));
        } catch (err) {
            toast.error('Failed to delete trip');
        }
    };

    const handleEditSuccess = () => {
        handleRefresh();
        setEditingTrip(null);
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
                    <h1 className="text-3xl font-bold text-slate-900">Trips</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        View and edit trip data for any report period
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={tripsLoading}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                    <RefreshCw className={`w-5 h-5 ${tripsLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Period Selector & Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Period Selector */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Report Period
                        </label>
                        <select
                            value={selectedPeriodId || ''}
                            onChange={e => {
                                const id = Number(e.target.value);
                                setSelectedPeriodId(id);
                                storePeriodId(id);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Conf#, company, driver, vehicle..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilterUnresolved(!filterUnresolved)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                filterUnresolved
                                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Unresolved Only
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex gap-4 mb-4 text-sm">
                <span className="text-slate-600">
                    Showing <span className="font-semibold">{filteredTrips.length}</span> of{' '}
                    <span className="font-semibold">{trips.length}</span> trips
                </span>
                <span className="text-amber-600">
                    {trips.filter(t => !t.coordinatesResolved).length} without coordinates
                </span>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                    {error}
                </div>
            )}

            {/* Trips Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Conf#</th>
                            <SortableHeader label="Date" sortKey="date" sort={sort} onSort={handleSort} />
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Time</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Company</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Service</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Driver</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Vehicle</th>
                            <SortableHeader label="Distance" sortKey="distance" sort={sort} onSort={handleSort} align="right" />
                            <SortableHeader label="Idle" sortKey="idle" sort={sort} onSort={handleSort} align="right" />
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {tripsLoading ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                                </td>
                            </tr>
                        ) : filteredTrips.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                    No trips found
                                </td>
                            </tr>
                        ) : (
                            filteredTrips.map(trip => (
                                <tr key={trip.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{trip.confNumber}</td>
                                    <td className="px-4 py-3">
                                        {new Date(trip.pickUpDate).toLocaleDateString()}
                                        {trip.originalPickUpDate && (
                                            <div
                                                className="mt-0.5 text-[11px] text-amber-600"
                                                title="Rescheduled by Reschedule Conflicts"
                                            >
                                                moved from {new Date(trip.originalPickUpDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {trip.garageOutTime.substring(0, 5)} - {trip.garageInTime.substring(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 max-w-[150px] truncate" title={trip.companyName}>
                                        {trip.companyName}
                                    </td>
                                    <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                {trip.serviceTypeName}
                                            </span>
                                    </td>
                                    <AssignedCell
                                        assigned={trip.assignedDriverName}
                                        imported={trip.importedDriverName}
                                        className="px-4 py-3 text-slate-600"
                                    />
                                    <AssignedCell
                                        assigned={trip.assignedVehiclePlate}
                                        imported={trip.importedVehiclePlate}
                                        className="px-4 py-3 font-mono text-xs"
                                    />
                                    <td className="px-4 py-3 text-right">
                                        {trip.distanceKm !== null ? (
                                            <span className={trip.coordinatesResolved ? 'text-green-600' : 'text-amber-600'}>
                                                    {trip.distanceKm.toFixed(1)} km
                                                </span>
                                        ) : (
                                            <span className="text-red-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">
                                        {trip.drivingDurationHours != null ? (
                                            <span title={`Routed driving time: ${Number(trip.drivingDurationHours.toFixed(2))} h`}>
                                                {Number(trip.idleHours.toFixed(2))} h
                                            </span>
                                        ) : (
                                            <span
                                                className="text-slate-400"
                                                title="No routed driving time (distance was estimated or edited by hand)"
                                            >
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setEditingTrip(trip)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                title="Edit trip"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRecalculateDistance(trip.id)}
                                                disabled={recalculatingId === trip.id}
                                                className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                                title="Recalculate distance"
                                            >
                                                {recalculatingId === trip.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Calculator className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRecalculateFuel(trip)}
                                                disabled={trip.assignedVehicleId == null || recalculatingFuelId === trip.id}
                                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50 disabled:hover:text-slate-500 disabled:hover:bg-transparent"
                                                title={trip.assignedVehicleId == null
                                                    ? 'No vehicle assigned to this trip'
                                                    : `Recalculates fuel for vehicle ${trip.assignedVehiclePlate} for the whole period, not just this trip`}
                                            >
                                                {recalculatingFuelId === trip.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Fuel className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTrip(trip.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete trip"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTrip && (
                <EditTripModal
                    trip={editingTrip}
                    token={token!}
                    onClose={() => setEditingTrip(null)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Fuel Recalculation Modal */}
            {fuelPreview && (
                <FuelRecalcModal
                    periodId={fuelPreview.periodId}
                    vehicleId={fuelPreview.vehicleId}
                    plateNumber={fuelPreview.plateNumber}
                    preview={fuelPreview.preview}
                    token={token!}
                    onClose={() => setFuelPreview(null)}
                />
            )}
        </div>
    );
}
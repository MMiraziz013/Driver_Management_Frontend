import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Search, Edit2, Calculator, Trash2, Filter } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
    getReportPeriods,
    getTripsByPeriod,
    recalculateTripDistance,
    deleteTrip,
    TripDto,
    ReportPeriodSummary
} from '@/services/tripService';
import { EditTripModal } from './EditTripModal';

export function TripsPage() {
    const { token } = useAuth();

    const [periods, setPeriods] = useState<ReportPeriodSummary[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
    const [trips, setTrips] = useState<TripDto[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<TripDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnresolved, setFilterUnresolved] = useState(false);

    const [editingTrip, setEditingTrip] = useState<TripDto | null>(null);
    const [recalculatingId, setRecalculatingId] = useState<number | null>(null);

    // Load periods on mount
    useEffect(() => {
        async function loadPeriods() {
            if (!token) return;
            try {
                const data = await getReportPeriods(token);
                setPeriods(data);
                if (data.length > 0) {
                    setSelectedPeriodId(data[0].id);
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

    // Filter trips
    useEffect(() => {
        let result = trips;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.confNumber.toLowerCase().includes(term) ||
                t.companyName.toLowerCase().includes(term) ||
                t.routingDetails.toLowerCase().includes(term) ||
                (t.importedDriverName?.toLowerCase().includes(term)) ||
                (t.importedVehiclePlate?.toLowerCase().includes(term))
            );
        }

        if (filterUnresolved) {
            result = result.filter(t => !t.coordinatesResolved);
        }

        setFilteredTrips(result);
    }, [trips, searchTerm, filterUnresolved]);

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
            setTrips(prev => prev.map(t =>
                t.id === tripId
                    ? { ...t, distanceKm: newDistance, coordinatesResolved: newDistance !== null }
                    : t
            ));
        } catch (err) {
            alert('Failed to recalculate distance: ' + (err as Error).message);
        } finally {
            setRecalculatingId(null);
        }
    };

    const handleDeleteTrip = async (tripId: number) => {
        if (!token) return;
        if (!confirm('Are you sure you want to delete this trip?')) return;

        try {
            await deleteTrip(tripId, token);
            setTrips(prev => prev.filter(t => t.id !== tripId));
        } catch (err) {
            alert('Failed to delete trip');
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
                            onChange={e => setSelectedPeriodId(Number(e.target.value))}
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
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Date</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Time</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Company</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Service</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Driver</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Vehicle</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Distance</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-700">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {tripsLoading ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                                </td>
                            </tr>
                        ) : filteredTrips.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                    No trips found
                                </td>
                            </tr>
                        ) : (
                            filteredTrips.map(trip => (
                                <tr key={trip.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{trip.confNumber}</td>
                                    <td className="px-4 py-3">
                                        {new Date(trip.pickUpDate).toLocaleDateString()}
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
                                    <td className="px-4 py-3 text-slate-600">
                                        {trip.importedDriverName || '-'}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {trip.importedVehiclePlate || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {trip.distanceKm !== null ? (
                                            <span className={trip.coordinatesResolved ? 'text-green-600' : 'text-amber-600'}>
                                                    {trip.distanceKm.toFixed(1)} km
                                                </span>
                                        ) : (
                                            <span className="text-red-500">—</span>
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
        </div>
    );
}
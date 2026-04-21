import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TripDto, updateTrip, UpdateTripDto } from '@/services/tripService';
import { API_BASE_URL } from '@/config/api';

interface Props {
    trip: TripDto;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface VehicleType {
    id: number;
    name: string;
}

interface ServiceType {
    id: number;
    name: string;
}

export function EditTripModal({ trip, token, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState({
        confNumber: trip.confNumber,
        pickUpDate: trip.pickUpDate.split('T')[0],
        garageOutTime: trip.garageOutTime.substring(0, 5),
        garageInTime: trip.garageInTime.substring(0, 5),
        companyName: trip.companyName,
        routingDetails: trip.routingDetails,
        distanceKm: trip.distanceKm?.toString() || '',
        importedDriverName: trip.importedDriverName || '',
        importedVehiclePlate: trip.importedVehiclePlate || '',
        pmtMethod: trip.pmtMethod || '',
        vehicleTypeId: trip.vehicleTypeId,
        serviceTypeId: trip.serviceTypeId,
        includedInReport: trip.includedInReport,
    });

    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load vehicle types and service types
    useEffect(() => {
        async function loadTypes() {
            try {
                const [vtRes, stRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/vehicle-types`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/service-types`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (vtRes.ok) {
                    const vtData = await vtRes.json();
                    setVehicleTypes(vtData.data || []);
                }
                if (stRes.ok) {
                    const stData = await stRes.json();
                    setServiceTypes(stData.data || []);
                }
            } catch (err) {
                console.error('Failed to load types:', err);
            }
        }
        loadTypes();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const dto: UpdateTripDto = {
                id: trip.id,
                confNumber: formData.confNumber,
                pickUpDate: formData.pickUpDate,
                garageOutTime: formData.garageOutTime + ':00',
                garageInTime: formData.garageInTime + ':00',
                companyName: formData.companyName,
                routingDetails: formData.routingDetails,
                distanceKm: formData.distanceKm ? parseFloat(formData.distanceKm) : null,
                importedDriverName: formData.importedDriverName || null,
                importedVehiclePlate: formData.importedVehiclePlate || null,
                pmtMethod: formData.pmtMethod || null,
                vehicleTypeId: formData.vehicleTypeId,
                serviceTypeId: formData.serviceTypeId,
                includedInReport: formData.includedInReport,
            };

            await updateTrip(dto, token);
            onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Edit Trip</h2>
                        <p className="text-sm text-slate-500">Conf# {trip.confNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Conf Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Conf Number
                            </label>
                            <input
                                type="text"
                                value={formData.confNumber}
                                onChange={e => handleChange('confNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Pick Up Date
                            </label>
                            <input
                                type="date"
                                value={formData.pickUpDate}
                                onChange={e => handleChange('pickUpDate', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Garage Out Time */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Garage Out Time
                            </label>
                            <input
                                type="time"
                                value={formData.garageOutTime}
                                onChange={e => handleChange('garageOutTime', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Garage In Time */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Garage In Time
                            </label>
                            <input
                                type="time"
                                value={formData.garageInTime}
                                onChange={e => handleChange('garageInTime', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Company Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={e => handleChange('companyName', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Routing Details */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Routing Details
                            </label>
                            <textarea
                                value={formData.routingDetails}
                                onChange={e => handleChange('routingDetails', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Vehicle Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Vehicle Type
                            </label>
                            <select
                                value={formData.vehicleTypeId}
                                onChange={e => handleChange('vehicleTypeId', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {vehicleTypes.map(vt => (
                                    <option key={vt.id} value={vt.id}>{vt.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Service Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Service Type
                            </label>
                            <select
                                value={formData.serviceTypeId}
                                onChange={e => handleChange('serviceTypeId', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                {serviceTypes.map(st => (
                                    <option key={st.id} value={st.id}>{st.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Distance */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Distance (km)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.distanceKm}
                                onChange={e => handleChange('distanceKm', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Auto-calculated or manual"
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Payment Method
                            </label>
                            <input
                                type="text"
                                value={formData.pmtMethod}
                                onChange={e => handleChange('pmtMethod', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Imported Driver */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Driver (from import)
                            </label>
                            <input
                                type="text"
                                value={formData.importedDriverName}
                                onChange={e => handleChange('importedDriverName', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="For Field Trips"
                            />
                        </div>

                        {/* Imported Vehicle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Vehicle (from import)
                            </label>
                            <input
                                type="text"
                                value={formData.importedVehiclePlate}
                                onChange={e => handleChange('importedVehiclePlate', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="For Field Trips"
                            />
                        </div>

                        {/* Include in Report */}
                        <div className="col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.includedInReport}
                                    onChange={e => handleChange('includedInReport', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">Include in report</span>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
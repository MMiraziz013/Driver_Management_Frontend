import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface Vehicle {
    id: number;
    plateNumber: string;
    model: string | null;
    color: string;
    requiredDriverCategory: string | number;
    vehicleTypeId?: number;
    vehicleTypeName?: string;
    fuelTankCapacity?: number | null;
    fuelConsumptionPer100Km?: number | null;
    fuelType?: string | null;  // Now a string
    initialFuelLevel?: number | null;
    currentMileage?: number | null;
}

interface EditCarModalProps {
    isOpen: boolean;
    vehicle: Vehicle | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORY_MAP: Record<string, number> = { 'B': 1, 'C': 2, 'D': 3 };

// Fuel types as strings (matching backend expectations)
const FUEL_TYPES = [
    { label: 'АИ-95', value: 'АИ-95' },
    { label: 'АИ-92', value: 'АИ-92' },
    { label: 'ДТ', value: 'ДТ' },
    { label: 'Electro', value: 'Electro' },
];

export function EditCarModal({ isOpen, vehicle, onClose, onSuccess }: EditCarModalProps) {
    const authFetch = useAuthFetch();

    // Basic info
    const [plateNumber, setPlateNumber] = useState('');
    const [model, setModel] = useState('');
    const [color, setColor] = useState('');
    const [category, setCategory] = useState('B');
    const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
    const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

    // Fuel & mileage info
    const [fuelTankCapacity, setFuelTankCapacity] = useState<string>('');
    const [fuelConsumptionPer100Km, setFuelConsumptionPer100Km] = useState<string>('');
    const [fuelType, setFuelType] = useState<string>('АИ-95');
    const [initialFuelLevel, setInitialFuelLevel] = useState<string>('');
    const [currentMileage, setCurrentMileage] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    // Fetch vehicle types for dropdown
    useEffect(() => {
        const fetchVehicleTypes = async () => {
            setIsLoadingTypes(true);
            try {
                const response = await authFetch(`${API_BASE_URL}/vehicle-types`);
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('Vehicle types endpoint not available');
                    setIsLoadingTypes(false);
                    return;
                }

                const text = await response.text();
                if (!text || text.trim() === '') {
                    console.warn('Empty response from vehicle types endpoint');
                    setIsLoadingTypes(false);
                    return;
                }

                const result = JSON.parse(text);
                if (response.ok && result.data) {
                    setVehicleTypes(result.data);
                } else if (response.ok && Array.isArray(result)) {
                    setVehicleTypes(result);
                }
            } catch (err) {
                console.warn('Vehicle types endpoint error:', err);
            } finally {
                setIsLoadingTypes(false);
            }
        };

        if (isOpen) {
            fetchVehicleTypes();
        }
    }, [isOpen]);

    // Populate form when vehicle changes
    useEffect(() => {
        if (vehicle) {
            setPlateNumber(vehicle.plateNumber || '');
            setModel(vehicle.model || '');
            setColor(vehicle.color || '');
            setVehicleTypeId(vehicle.vehicleTypeId || null);

            // Normalize category
            const cat = String(vehicle.requiredDriverCategory).trim().toUpperCase();
            const enumMap: Record<string, string> = { '1': 'B', '2': 'C', '3': 'D' };
            const normalizedCat = enumMap[cat] || cat;
            setCategory(['B', 'C', 'D'].includes(normalizedCat) ? normalizedCat : 'B');

            // Set fuel & mileage fields
            setFuelTankCapacity(vehicle.fuelTankCapacity?.toString() || '');
            setFuelConsumptionPer100Km(vehicle.fuelConsumptionPer100Km?.toString() || '');
            setFuelType(vehicle.fuelType || 'АИ-95');
            setInitialFuelLevel(vehicle.initialFuelLevel?.toString() || '');
            setCurrentMileage(vehicle.currentMileage?.toString() || '');
        }
    }, [vehicle]);

    if (!isOpen || !vehicle) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const dto = {
            id: vehicle.id,
            plateNumber: plateNumber.trim() || null,
            model: model.trim() || null,
            color: color.trim() || null,
            requiredDriverCategory: CATEGORY_MAP[category],
            vehicleTypeId: vehicleTypeId,
            fuelTankCapacity: fuelTankCapacity ? parseFloat(fuelTankCapacity) : null,
            fuelConsumptionPer100Km: fuelConsumptionPer100Km ? parseFloat(fuelConsumptionPer100Km) : null,
            fuelType: fuelType || null,  // Send as string
            initialFuelLevel: initialFuelLevel ? parseFloat(initialFuelLevel) : null,
            currentMileage: currentMileage ? parseFloat(currentMileage) : null,
        };

        try {
            const response = await authFetch(`${API_BASE_URL}/vehicles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errorText = await response.text();
                console.error('Update failed:', errorText);
                alert('Failed to update vehicle. Please try again.');
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            alert('Error updating vehicle. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-900">Edit Vehicle</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Plate Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={plateNumber}
                                onChange={e => setPlateNumber(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., ABC-1234"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Toyota Camry"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Color <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., White"
                                required
                            />
                        </div>

                        {vehicleTypes.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                                <select
                                    value={vehicleTypeId || ''}
                                    onChange={e => setVehicleTypeId(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={isLoadingTypes}
                                >
                                    <option value="">Select a type...</option>
                                    {vehicleTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Required Driver Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            >
                                <option value="B">B - Standard Vehicle</option>
                                <option value="C">C - Medium Vehicle</option>
                                <option value="D">D - Large Vehicle / Bus</option>
                            </select>
                        </div>
                    </div>

                    {/* Fuel & Mileage Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Fuel & Mileage</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
                                <select
                                    value={fuelType}
                                    onChange={(e) => setFuelType(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    {FUEL_TYPES.map(ft => (
                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tank Capacity (L)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={fuelTankCapacity}
                                    onChange={(e) => setFuelTankCapacity(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. 60"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Consumption (L/100km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={fuelConsumptionPer100Km}
                                    onChange={(e) => setFuelConsumptionPer100Km(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. 8.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Fuel (L)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={initialFuelLevel}
                                    onChange={(e) => setInitialFuelLevel(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. 45"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Mileage (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={currentMileage}
                                onChange={(e) => setCurrentMileage(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g. 15000"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoadingTypes}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
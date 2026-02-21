import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface AddCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface VehicleType {
    id: number;
    name: string;
}

const LICENSE_CATEGORIES = [
    { label: 'Category B', value: 1 },
    { label: 'Category C', value: 2 },
    { label: 'Category D', value: 3 },
];

// Fuel types as strings (matching backend expectations)
const FUEL_TYPES = [
    { label: 'АИ-95', value: 'АИ-95' },
    { label: 'АИ-92', value: 'АИ-92' },
    { label: 'ДТ', value: 'ДТ' },
    { label: 'Electro', value: 'Electro' },
];

export function AddCarModal({ isOpen, onClose, onSuccess }: AddCarModalProps) {
    const authFetch = useAuthFetch();

    // Basic info
    const [plateNumber, setPlateNumber] = useState('');
    const [model, setModel] = useState('');
    const [color, setColor] = useState('');
    const [vehicleTypeId, setVehicleTypeId] = useState<string>('');
    const [category, setCategory] = useState<number>(1);

    // Fuel & mileage info
    const [fuelTankCapacity, setFuelTankCapacity] = useState<string>('');
    const [fuelConsumptionPer100Km, setFuelConsumptionPer100Km] = useState<string>('');
    const [fuelType, setFuelType] = useState<string>('АИ-95');
    const [initialFuelLevel, setInitialFuelLevel] = useState<string>('');
    const [currentMileage, setCurrentMileage] = useState<string>('');

    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            authFetch(`${API_BASE_URL}/vehicle-types`)
                .then(res => res.json())
                .then(result => setVehicleTypes(result.data || []))
                .catch(err => console.error("Error fetching types:", err));
        }
    }, [isOpen]);

    const resetForm = () => {
        setPlateNumber('');
        setModel('');
        setColor('');
        setVehicleTypeId('');
        setCategory(1);
        setFuelTankCapacity('');
        setFuelConsumptionPer100Km('');
        setFuelType('АИ-95');
        setInitialFuelLevel('');
        setCurrentMileage('');
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            plateNumber,
            model: model || null,
            color,
            vehicleTypeId: parseInt(vehicleTypeId),
            requiredDriverCategory: category,
            fuelTankCapacity: fuelTankCapacity ? parseFloat(fuelTankCapacity) : null,
            fuelConsumptionPer100Km: fuelConsumptionPer100Km ? parseFloat(fuelConsumptionPer100Km) : null,
            fuelType: fuelType || null,  // Send as string
            initialFuelLevel: initialFuelLevel ? parseFloat(initialFuelLevel) : null,
            currentMileage: currentMileage ? parseFloat(currentMileage) : null,
        };

        try {
            const response = await authFetch(`${API_BASE_URL}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSuccess();
                onClose();
                resetForm();
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.message || 'Failed to save vehicle'}`);
            }
        } catch (error) {
            alert("Connection error. Is the backend running?");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-black">Add New Vehicle</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Plate Number *</label>
                            <input
                                type="text"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. 01/A123AA"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Chevrolet Malibu"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Color *</label>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">License Req. *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {LICENSE_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Vehicle Type *</label>
                            <select
                                value={vehicleTypeId}
                                onChange={(e) => setVehicleTypeId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            >
                                <option value="">Select type...</option>
                                {vehicleTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fuel & Mileage Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Fuel & Mileage</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Fuel Type</label>
                                <select
                                    value={fuelType}
                                    onChange={(e) => setFuelType(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {FUEL_TYPES.map(ft => (
                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Tank Capacity (L)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={fuelTankCapacity}
                                    onChange={(e) => setFuelTankCapacity(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. 60"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Consumption (L/100km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={fuelConsumptionPer100Km}
                                    onChange={(e) => setFuelConsumptionPer100Km(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. 8.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Initial Fuel (L)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={initialFuelLevel}
                                    onChange={(e) => setInitialFuelLevel(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. 45"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Current Mileage (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={currentMileage}
                                onChange={(e) => setCurrentMileage(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. 15000"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface AddCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Added to refresh the list after adding
}

interface VehicleType {
    id: number;
    name: string;
}

// Matching your DriverCategory Enum values
const LICENSE_CATEGORIES = [
    { label: 'Category B', value: 1 },
    { label: 'Category C', value: 2 },
    { label: 'Category D', value: 3 },
];

export function AddCarModal({ isOpen, onClose, onSuccess }: AddCarModalProps) {
    const [plateNumber, setPlateNumber] = useState('');
    const [model, setModel] = useState('');
    const [color, setColor] = useState('');
    const [vehicleTypeId, setVehicleTypeId] = useState<string>('');
    const [category, setCategory] = useState<number>(0);

    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Vehicle Types from the backend when modal opens
    useEffect(() => {
        if (isOpen) {
            fetch('http://localhost:5147/api/vehicle-types')
                .then(res => res.json())
                .then(result => setVehicleTypes(result.data || []))
                .catch(err => console.error("Error fetching types:", err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Matching your CreateVehicleDto
        const payload = {
            plateNumber,
            model: model || null,
            color,
            vehicleTypeId: parseInt(vehicleTypeId),
            requiredDriverCategory: category
        };

        try {
            const response = await fetch('http://localhost:5147/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSuccess(); // Refresh the table
                onClose();   // Close modal
                // Reset form
                setPlateNumber('');
                setModel('');
                setColor('');
                setVehicleTypeId('');
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-black">Add New Vehicle</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">Plate Number</label>
                        <input
                            type="text"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 01A123AA"
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
                            <label className="block text-sm font-bold text-black mb-1">Color</label>
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
                            <label className="block text-sm font-bold text-black mb-1">License Req.</label>
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
                        <label className="block text-sm font-bold text-black mb-1">Vehicle Type</label>
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
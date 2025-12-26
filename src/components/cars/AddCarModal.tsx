import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddCarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VEHICLE_TYPES = [
    'Standard Sedan',
    'Business Sedan',
    'SUV',
    'Truck',
    'Van',
    'Coupe',
    'Hatchback',
];

const LICENSE_CATEGORIES = ['B', 'C', 'D'];

export function AddCarModal({ isOpen, onClose }: AddCarModalProps) {
    const [plateNumber, setPlateNumber] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [color, setColor] = useState<string>('');
    const [vehicleType, setVehicleType] = useState<string>('');
    const [category, setCategory] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Plate Number:', plateNumber);
        console.log('Model:', model);
        console.log('Color:', color);
        console.log('Vehicle Type:', vehicleType);
        console.log('Category:', category);
        onClose();
        // Reset form
        setPlateNumber('');
        setModel('');
        setColor('');
        setVehicleType('');
        setCategory('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-slate-900">Add a Car</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-slate-700 mb-2">
                            Plate Number
                        </label>
                        <input
                            type="text"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., ABC-1234"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Model
                        </label>
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., Toyota Camry"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Color
                        </label>
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., Silver, Black, White"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Vehicle Type
                        </label>
                        <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select vehicle type</option>
                            {VEHICLE_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Category (Required License)
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select category</option>
                            {LICENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Add Car
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

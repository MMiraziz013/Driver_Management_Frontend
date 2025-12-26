import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddVehicleTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddVehicleTypeModal({ isOpen, onClose }: AddVehicleTypeModalProps) {
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Name:', name);
        console.log('Description:', description);
        onClose();
        // Reset form
        setName('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-slate-900">Add a Vehicle Type</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-slate-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., SUV, Sedan, Truck"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Enter vehicle type description"
                            rows={4}
                            required
                        />
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
                            Add Vehicle Type
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

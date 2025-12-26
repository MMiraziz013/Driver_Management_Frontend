import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addDriver, AddDriverDto } from '@/services/driverService';

interface AddDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // To refresh the list after adding
}

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'];

export function AddDriverModal({ isOpen, onClose, onSuccess }: AddDriverModalProps) {
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('');
    const [employmentType, setEmploymentType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const dto: AddDriverDto = {
            fullName,
            birthYear: birthDate, // backend DTO calls it BirthYear but type is DateOnly
            address,
            driverCategories: category,
            employmentType: employmentType === 'full-time' ? 'FullTime' : 'PartTime' // Matching backend Enums
        };

        try {
            await addDriver(dto);
            onSuccess(); // Refresh the list
            onClose();   // Close modal
            // Reset form
            setFullName('');
            setBirthDate('');
            setAddress('');
            setCategory('');
            setEmploymentType('');
        } catch (error) {
            alert(error instanceof Error ? error.message : "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Add a Driver</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Birth Date</label>
                        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                               className="w-full px-4 py-2 border rounded-lg" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                               className="w-full px-4 py-2 border rounded-lg" placeholder="123 Street, City" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Category</label>
                        <div className="flex flex-wrap gap-2">
                            {LICENSE_CATEGORIES.map((cat) => (
                                <button key={cat} type="button" onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all ${category === cat
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['full-time', 'part-time'].map((type) => (
                                <button key={type} type="button" onClick={() => setEmploymentType(type)}
                                        className={`px-4 py-3 rounded-lg border text-sm capitalize ${employmentType === type
                                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                            : 'bg-white border-slate-200 text-slate-600'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isSubmitting ? 'Adding...' : 'Add Driver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
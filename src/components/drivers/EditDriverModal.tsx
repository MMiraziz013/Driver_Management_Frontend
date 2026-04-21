import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateDriver, UpdateDriverDto } from '@/services/driverService';

interface EditDriverModalProps {
    isOpen: boolean;
    driver: any | null;
    token: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORY_MAP: Record<string, number> = { 'B': 1, 'C': 2, 'D': 3 };
const EMPLOYMENT_MAP: Record<string, number> = { 'FullTime': 0, 'PartTime': 1 };

export function EditDriverModal({ isOpen, driver, token, onClose, onSuccess }: EditDriverModalProps) {
    const [fullName, setFullName] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('B');
    const [employmentType, setEmploymentType] = useState('FullTime');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (driver) {
            setFullName(driver.fullName || '');
            setAddress(driver.address || '');

            if (driver.age) {
                const currentYear = new Date().getFullYear();
                const estimatedBirthYear = currentYear - driver.age;
                setBirthYear(`${estimatedBirthYear}-01-01`);
            } else if (driver.birthDate) {
                setBirthYear(driver.birthDate);
            } else {
                setBirthYear('');
            }

            setCategory(driver.licenseCategory || 'B');
            setEmploymentType(driver.employmentType || 'FullTime');
            setError(null);
        }
    }, [driver]);

    if (!isOpen || !driver) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!birthYear) {
            setError('Please select a birth date');
            setIsSubmitting(false);
            return;
        }

        if (!token) {
            setError('Authentication required. Please log in again.');
            setIsSubmitting(false);
            return;
        }

        const selectedDate = new Date(birthYear);
        const today = new Date();

        if (selectedDate > today) {
            setError('Birth date cannot be in the future');
            setIsSubmitting(false);
            return;
        }

        const dto: UpdateDriverDto = {
            id: parseInt(driver.id),
            fullName: fullName.trim() || null,
            birthYear: birthYear,
            address: address.trim() || null,
            driverCategory: CATEGORY_MAP[category],
            employmentType: EMPLOYMENT_MAP[employmentType]
        };

        try {
            await updateDriver(dto, token);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating driver:', err);
            setError(err instanceof Error ? err.message : 'Failed to update driver');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Edit Driver</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Birth Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={birthYear}
                            onChange={e => setBirthYear(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            max={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            License Category <span className="text-red-500">*</span>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Employment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={employmentType}
                            onChange={e => setEmploymentType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        >
                            <option value="FullTime">Full-Time</option>
                            <option value="PartTime">Part-Time</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
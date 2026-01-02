import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditDriverModalProps {
    isOpen: boolean;
    driver: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

// Mapping letters to the Enum values in C# (B=1, C=2, D=3)
const CATEGORY_MAP: Record<string, number> = { 'B': 1, 'C': 2, 'D': 3 };
const REVERSE_CATEGORY_MAP: Record<number, string> = { 1: 'B', 2: 'C', 3: 'D' };

// Employment type enum mapping (FullTime=0, PartTime=1)
const EMPLOYMENT_MAP: Record<string, number> = { 'FullTime': 0, 'PartTime': 1 };

export function EditDriverModal({ isOpen, driver, onClose, onSuccess }: EditDriverModalProps) {
    const [fullName, setFullName] = useState('');
    const [birthYear, setBirthYear] = useState(''); // Actually stores full date in YYYY-MM-DD format
    const [address, setAddress] = useState('');
    const [category, setCategory] = useState('B');
    const [employmentType, setEmploymentType] = useState('FullTime');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fill form when driver changes
    useEffect(() => {
        if (driver) {
            setFullName(driver.fullName || '');
            setAddress(driver.address || '');

            // Calculate birth date from age if available
            if (driver.age) {
                const currentYear = new Date().getFullYear();
                const estimatedBirthYear = currentYear - driver.age;
                // Set to January 1st of estimated year as default
                setBirthYear(`${estimatedBirthYear}-01-01`);
            } else if (driver.birthDate) {
                // If actual birth date is available, use it
                setBirthYear(driver.birthDate);
            } else {
                setBirthYear('');
            }

            // Map license category back to letter
            setCategory(driver.licenseCategory || 'B');

            // Map employment type
            setEmploymentType(driver.employmentType || 'FullTime');
        }
    }, [driver]);

    if (!isOpen || !driver) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate birth date
        if (!birthYear) {
            alert('Please select a birth date');
            setIsSubmitting(false);
            return;
        }

        const selectedDate = new Date(birthYear);
        const today = new Date();

        if (selectedDate > today) {
            alert('Birth date cannot be in the future');
            setIsSubmitting(false);
            return;
        }

        const dto = {
            id: parseInt(driver.id),
            fullName: fullName.trim() || null,
            birthYear: birthYear, // Send full date in YYYY-MM-DD format
            address: address.trim() || null,
            driverCategory: CATEGORY_MAP[category],
            employmentType: EMPLOYMENT_MAP[employmentType]
        };

        try {
            const response = await fetch('http://localhost:5147/api/drivers', {
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
                alert('Failed to update driver. Please check the form and try again.');
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert('Error updating driver. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Edit Driver</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Full Name */}
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

                    {/* Birth Date */}
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

                    {/* Address */}
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

                    {/* License Category */}
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

                    {/* Employment Type */}
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

                    {/* Action Buttons */}
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
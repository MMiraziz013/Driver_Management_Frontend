import React, { useState } from 'react';
import { Pencil, Trash2, MapPin, Briefcase, CreditCard, Loader2 } from 'lucide-react';
import { VacationStatusBadge } from '@/components/drivers/VacationStatusBadge';

interface DriverFront {
    id: string;
    fullName: string;
    age: number;
    address: string;
    employmentType: string;
    licenseCategory: string;
    isActive: boolean;
}

interface DriverCardProps {
    driver: DriverFront;
    onEdit: (driver: DriverFront) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

const getEmploymentBadgeStyles = (type: string) => {
    const normalizedType = type?.toLowerCase() || '';
    if (normalizedType.includes('full')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (normalizedType.includes('part')) {
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (normalizedType.includes('contract')) {
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
};

const getLicenseBadgeStyles = (category: string) => {
    const normalizedCat = category?.toUpperCase() || '';
    if (normalizedCat.includes('D')) {
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (normalizedCat.includes('C')) {
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
};

export function DriverCard({ driver, onEdit, onDelete, onToggleStatus }: DriverCardProps) {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            await onToggleStatus(driver.id, driver.isActive);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
            driver.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/30'
        }`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            driver.isActive ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}>
                            {driver.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className={`font-semibold ${driver.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                                {driver.fullName}
                            </h3>
                            <p className="text-sm text-slate-500">{driver.age} years old</p>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${driver.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {driver.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                            onClick={handleToggle}
                            disabled={isToggling}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                driver.isActive ? 'bg-green-500' : 'bg-slate-300'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            role="switch"
                            aria-checked={driver.isActive}
                        >
                            {isToggling ? (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </span>
                            ) : (
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                        driver.isActive ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            )}
                        </button>
                    </div>
                    <VacationStatusBadge driverId={driver.id} compact />

                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {/* Address */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{driver.address || 'No address'}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    {/* Employment Type */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getEmploymentBadgeStyles(driver.employmentType)}`}>
                        <Briefcase className="w-3 h-3" />
                        {driver.employmentType || 'Unknown'}
                    </span>

                    {/* License Category */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getLicenseBadgeStyles(driver.licenseCategory)}`}>
                        <CreditCard className="w-3 h-3" />
                        {driver.licenseCategory || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Footer - Actions */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                    onClick={() => onEdit(driver)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={() => onDelete(driver.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </div>
    );
}
import React from 'react';
import { Phone, MapPin, IdCard, CircleUserRound, Pencil, Trash2 } from 'lucide-react';

interface Driver {
    id: string;
    fullName: string;
    age: number;
    address: string;
    employmentType: string;
    licenseCategory: string; // Backend sends a single string 'Category'
    isActive: boolean;       // Backend sends 'IsActive'
}

interface DriverCardProps {
    driver: Driver;
    onEdit: (driver: Driver) => void;
    onDelete: (id: string) => void;
}

export function DriverCard({ driver, onEdit, onDelete }: DriverCardProps) {
    const categories = driver.licenseCategory ? driver.licenseCategory.split(',') : [];

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-slate-900 font-medium mb-1">{driver.fullName}</h3>
                    <p className="text-slate-500 text-sm">Employment: {driver.employmentType}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                        driver.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {/* Action Buttons */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(driver)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(driver.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600">
                    <CircleUserRound className="w-4 h-4" />
                    <span className="text-sm">{driver.age} years old</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{driver.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <IdCard className="w-4 h-4" />
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <span key={cat} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">
                                {cat.trim()}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
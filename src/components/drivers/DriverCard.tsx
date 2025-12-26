import React from 'react';
import { Phone, MapPin, IdCard, CircleUserRound } from 'lucide-react';

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
}

export function DriverCard({ driver }: DriverCardProps) {
    const categories = driver.licenseCategory ? driver.licenseCategory.split(',') : [];
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-slate-900 mb-1">
                        {driver.fullName}
                    </h3>
                    <p className="text-slate-500">Employment: {driver.employmentType}</p>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs ${
                        driver.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
          {driver.isActive ? 'Active' : 'Inactive'}
        </span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600">
                    <CircleUserRound className="w-4 h-4" />
                    <span className="text-sm">{driver.age}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{driver.address}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                        <IdCard className="w-4 h-4" />
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <span key={cat} className="px-2 py-1 bg-slate-100 rounded text-xs">
            {cat.trim()}
        </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

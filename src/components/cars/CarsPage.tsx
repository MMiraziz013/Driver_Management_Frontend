import React from 'react';
import { Plus } from 'lucide-react';

interface Car {
    id: string;
    number: number;
    plateNumber: string;
    model: string;
    color: string;
    active: boolean;
    companyName: string;
}

const mockCars: Car[] = [
    {
        id: '1',
        number: 1,
        plateNumber: 'ABC-1234',
        model: 'Toyota Camry',
        color: 'Silver',
        active: true,
        companyName: 'Our Company',
    },
    {
        id: '2',
        number: 2,
        plateNumber: 'XYZ-5678',
        model: 'Honda CR-V',
        color: 'White',
        active: true,
        companyName: 'Our Company',
    },
    {
        id: '3',
        number: 3,
        plateNumber: 'LMN-9012',
        model: 'Ford F-150',
        color: 'Black',
        active: false,
        companyName: 'Partner Fleet Co.',
    },
    {
        id: '4',
        number: 4,
        plateNumber: 'DEF-3456',
        model: 'Chevrolet Silverado',
        color: 'Red',
        active: true,
        companyName: 'Our Company',
    },
    {
        id: '5',
        number: 5,
        plateNumber: 'GHI-7890',
        model: 'Tesla Model 3',
        color: 'Blue',
        active: true,
        companyName: 'Electric Fleet Inc.',
    },
    {
        id: '6',
        number: 6,
        plateNumber: 'JKL-2345',
        model: 'BMW X5',
        color: 'Gray',
        active: false,
        companyName: 'Our Company',
    },
    {
        id: '7',
        number: 7,
        plateNumber: 'MNO-6789',
        model: 'Mercedes-Benz Sprinter',
        color: 'White',
        active: true,
        companyName: 'Partner Fleet Co.',
    },
    {
        id: '8',
        number: 8,
        plateNumber: 'PQR-0123',
        model: 'Audi A4',
        color: 'Black',
        active: true,
        companyName: 'Our Company',
    },
];

export function CarsPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-slate-900">Cars</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    Add a Car
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 text-left text-slate-600">Number</th>
                            <th className="px-6 py-3 text-left text-slate-600">
                                Plate Number
                            </th>
                            <th className="px-6 py-3 text-left text-slate-600">Model</th>
                            <th className="px-6 py-3 text-left text-slate-600">Color</th>
                            <th className="px-6 py-3 text-left text-slate-600">Status</th>
                            <th className="px-6 py-3 text-left text-slate-600">
                                Company Name
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {mockCars.map((car, index) => (
                            <tr
                                key={car.id}
                                className={`border-b border-slate-200 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                }`}
                            >
                                <td className="px-6 py-4 text-slate-900">{car.number}</td>
                                <td className="px-6 py-4 text-slate-900">
                                    {car.plateNumber}
                                </td>
                                <td className="px-6 py-4 text-slate-900">{car.model}</td>
                                <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{
                              backgroundColor:
                                  car.color.toLowerCase() === 'silver'
                                      ? '#c0c0c0'
                                      : car.color.toLowerCase() === 'gray'
                                          ? '#808080'
                                          : car.color.toLowerCase(),
                          }}
                      />
                      <span className="text-slate-900">{car.color}</span>
                    </span>
                                </td>
                                <td className="px-6 py-4">
                    <span
                        className={`px-3 py-1 rounded-full text-xs ${
                            car.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {car.active ? 'Active' : 'Inactive'}
                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-900">
                                    {car.companyName}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

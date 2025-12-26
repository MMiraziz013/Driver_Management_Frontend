import React from 'react';
import { Package } from 'lucide-react';

interface VehicleType {
    id: string;
    name: string;
    imageUrl: string;
    quantity: number;
}

interface VehicleTypeCardProps {
    vehicleType: VehicleType;
}

const vehicleImages: Record<string, string> = {
    'Sedan': 'https://images.unsplash.com/photo-1658662160331-62f7e52e63de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWRhbiUyMGNhcnxlbnwxfHx8fDE3NjU2MDUxOTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'SUV': 'https://images.unsplash.com/photo-1708148246994-b7b3c818090d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjB2ZWhpY2xlfGVufDF8fHx8MTc2NTU1MTM4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'Truck': 'https://images.unsplash.com/photo-1551830820-330a71b99659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWNrdXAlMjB0cnVja3xlbnwxfHx8fDE3NjU1NTYwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'Van': 'https://images.unsplash.com/photo-1594080049844-e4946e47eb8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YW4lMjB2ZWhpY2xlfGVufDF8fHx8MTc2NTUwNjM5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'Coupe': 'https://images.unsplash.com/photo-1696581084151-8a038c7dfc83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwZSUyMHNwb3J0cyUyMGNhcnxlbnwxfHx8fDE3NjU2MDUyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'Hatchback': 'https://images.unsplash.com/photo-1627280052756-cc5e080c8458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXRjaGJhY2slMjBjYXJ8ZW58MXx8fHwxNzY1NjA1MjAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
};

export function VehicleTypeCard({ vehicleType }: VehicleTypeCardProps) {
    const imageUrl = vehicleImages[vehicleType.name] || vehicleType.imageUrl;

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-slate-100 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={vehicleType.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300" />
                    </div>
                )}
            </div>

            <div className="p-6">
                <h3 className="text-slate-900 mb-2">{vehicleType.name}</h3>
                <div className="flex items-center gap-2 text-slate-600">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Quantity: {vehicleType.quantity}</span>
                </div>
            </div>
        </div>
    );
}

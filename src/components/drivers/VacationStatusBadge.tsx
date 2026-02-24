'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Palmtree, Loader2 } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface VacationStatusBadgeProps {
    driverId: string;
    compact?: boolean;
}

interface VacationInfo {
    isOnVacation: boolean;
    currentVacation?: {
        startDate: string;
        endDate: string;
        notes: string | null;
    };
    upcomingVacation?: {
        startDate: string;
        endDate: string;
    };
}

export function VacationStatusBadge({ driverId, compact = false }: VacationStatusBadgeProps) {
    const authFetch = useAuthFetch();
    const [loading, setLoading] = useState(true);
    const [vacationInfo, setVacationInfo] = useState<VacationInfo | null>(null);

    useEffect(() => {
        const checkVacationStatus = async () => {
            try {
                // Check if driver is on vacation today
                const response = await authFetch(`${API_BASE_URL}/driver-vacations/driver/${driverId}/status`);
                const data = await response.json();

                if (response.ok) {
                    // Also get driver's vacations to show upcoming
                    const vacationsResponse = await authFetch(`${API_BASE_URL}/driver-vacations/driver/${driverId}`);
                    const vacationsData = await vacationsResponse.json();

                    let currentVacation = undefined;
                    let upcomingVacation = undefined;

                    if (vacationsResponse.ok && vacationsData.data) {
                        const vacations = vacationsData.data;
                        currentVacation = vacations.find((v: any) => v.isActive);
                        upcomingVacation = vacations.find((v: any) => v.isFuture);
                    }

                    setVacationInfo({
                        isOnVacation: data.data === true,
                        currentVacation,
                        upcomingVacation
                    });
                }
            } catch (err) {
                console.error('Error checking vacation status:', err);
            } finally {
                setLoading(false);
            }
        };

        checkVacationStatus();
    }, [driverId, authFetch]);

    if (loading) {
        return compact ? null : (
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        );
    }

    if (!vacationInfo) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Currently on vacation
    if (vacationInfo.isOnVacation && vacationInfo.currentVacation) {
        if (compact) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    <Palmtree className="w-3 h-3" />
                    On Leave
                </span>
            );
        }

        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Palmtree className="w-4 h-4 text-amber-600" />
                <div className="text-sm">
                    <span className="font-medium text-amber-800">On Vacation</span>
                    <span className="text-amber-600 ml-2">
                        until {formatDate(vacationInfo.currentVacation.endDate)}
                    </span>
                </div>
            </div>
        );
    }

    // Has upcoming vacation
    if (vacationInfo.upcomingVacation) {
        if (compact) {
            return (
                <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200"
                    title={`Vacation: ${formatDate(vacationInfo.upcomingVacation.startDate)} - ${formatDate(vacationInfo.upcomingVacation.endDate)}`}
                >
                    <Calendar className="w-3 h-3" />
                    Upcoming
                </span>
            );
        }

        // Calculate days until vacation
        const daysUntil = Math.ceil(
            (new Date(vacationInfo.upcomingVacation.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil <= 7) {
            return (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="text-sm">
                        <span className="font-medium text-blue-800">Vacation in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</span>
                        <span className="text-blue-600 ml-2">
                            {formatDate(vacationInfo.upcomingVacation.startDate)}
                        </span>
                    </div>
                </div>
            );
        }
    }

    return null;
}
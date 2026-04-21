import { API_BASE_URL } from '@/config/api';

export interface TripDto {
    id: number;
    confNumber: string;
    pickUpDate: string;
    garageOutTime: string;
    garageInTime: string;
    companyName: string;
    routingDetails: string;
    distanceKm: number | null;
    coordinatesResolved: boolean;
    includedInReport: boolean;
    importedDriverName: string | null;
    importedVehiclePlate: string | null;
    pmtMethod: string | null;
    vehicleTypeName: string;
    serviceTypeName: string;
    vehicleTypeId: number;
    serviceTypeId: number;
}

export interface UpdateTripDto {
    id: number;
    confNumber?: string;
    pickUpDate?: string;
    garageOutTime?: string;
    garageInTime?: string;
    companyName?: string;
    routingDetails?: string;
    distanceKm?: number | null;
    includedInReport?: boolean;
    importedDriverName?: string | null;
    importedVehiclePlate?: string | null;
    pmtMethod?: string | null;
    vehicleTypeId?: number;
    serviceTypeId?: number;
}

export interface ReportPeriodSummary {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    tripCount: number;
}

export async function getReportPeriods(token: string): Promise<ReportPeriodSummary[]> {
    const response = await fetch(`${API_BASE_URL}/report-periods`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch report periods');
    }

    const data = await response.json();
    return data.data || [];
}

export async function getTripsByPeriod(periodId: number, token: string): Promise<TripDto[]> {
    const response = await fetch(`${API_BASE_URL}/trips?periodId=${periodId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch trips');
    }

    const data = await response.json();
    return data.data || [];
}

export async function updateTrip(dto: UpdateTripDto, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/trips/${dto.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update trip');
    }
}

export async function recalculateTripDistance(tripId: number, token: string): Promise<number | null> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/recalculate-distance`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to recalculate distance');
    }

    const data = await response.json();
    return data.data;
}

export async function deleteTrip(tripId: number, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete trip');
    }
}
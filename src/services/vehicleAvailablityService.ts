import { API_BASE_URL } from '@/config/api';

export interface VehicleUnavailablePeriod {
    id: number;
    vehicleId: number;
    startDate: string;
    endDate: string;
    reason: string | null;
    notes: string | null;
    createdAt: string;
}

export interface CreateVehicleUnavailablePeriodDto {
    vehicleId: number;
    startDate: string;
    endDate: string;
    reason?: string;
    notes?: string;
}

export interface UpdateVehicleUnavailablePeriodDto {
    id: number;
    startDate: string;
    endDate: string;
    reason?: string;
    notes?: string;
}

export const getVehicleUnavailablePeriods = async (
    authFetch: typeof fetch,
    vehicleId: number
): Promise<VehicleUnavailablePeriod[]> => {
    const response = await authFetch(`${API_BASE_URL}/vehicles/${vehicleId}/unavailable-periods`);
    if (!response.ok) {
        throw new Error('Failed to fetch unavailable periods');
    }
    const result = await response.json();
    return result.data || [];
};

export const getAllUnavailablePeriods = async (
    authFetch: typeof fetch
): Promise<VehicleUnavailablePeriod[]> => {
    const response = await authFetch(`${API_BASE_URL}/vehicles/unavailable-periods`);
    if (!response.ok) {
        throw new Error('Failed to fetch unavailable periods');
    }
    const result = await response.json();
    return result.data || [];
};

export const createVehicleUnavailablePeriod = async (
    authFetch: typeof fetch,
    dto: CreateVehicleUnavailablePeriodDto
): Promise<VehicleUnavailablePeriod | null> => {
    const response = await authFetch(`${API_BASE_URL}/vehicles/unavailable-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create unavailable period');
    }

    const result = await response.json();
    return result.data;
};

export const updateVehicleUnavailablePeriod = async (
    authFetch: typeof fetch,
    dto: UpdateVehicleUnavailablePeriodDto
): Promise<VehicleUnavailablePeriod | null> => {
    const response = await authFetch(`${API_BASE_URL}/vehicles/unavailable-periods/${dto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update unavailable period');
    }

    const result = await response.json();
    return result.data;
};

export const deleteVehicleUnavailablePeriod = async (
    authFetch: typeof fetch,
    id: number
): Promise<boolean> => {
    const response = await authFetch(`${API_BASE_URL}/vehicles/unavailable-periods/${id}`, {
        method: 'DELETE',
    });
    return response.ok;
};

export const checkVehicleAvailability = async (
    authFetch: typeof fetch,
    vehicleId: number,
    date: Date
): Promise<{ vehicleId: number; date: string; isAvailable: boolean }> => {
    const dateStr = date.toISOString().split('T')[0];
    const response = await authFetch(`${API_BASE_URL}/vehicles/${vehicleId}/available?date=${dateStr}`);
    if (!response.ok) {
        throw new Error('Failed to check availability');
    }
    return await response.json();
};
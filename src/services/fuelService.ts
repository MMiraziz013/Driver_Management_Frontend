import { API_BASE_URL } from '@/config/api';

// DTOs
export interface FuelSettingsDto {
    id: number;
    // Assumed average speed (km/h) used to estimate a trip's distance from its duration
    durationFallbackSpeedKmh: number;
    updatedAt: string;
}

export interface UpdateFuelSettingsDto {
    durationFallbackSpeedKmh: number;
}

export const MAX_DURATION_FALLBACK_SPEED_KMH = 150;

async function readError(response: Response, fallback: string): Promise<string> {
    if (response.status === 403) {
        return 'You do not have permission to perform this action.';
    }
    try {
        const data = await response.json();
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            return data.errors.join(', ');
        }
    } catch {
        // Body is not JSON, use the fallback message
    }
    return fallback;
}

// API Functions
export async function getFuelSettings(token: string): Promise<FuelSettingsDto> {
    const response = await fetch(`${API_BASE_URL}/fuel-settings`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await readError(response, 'Failed to fetch fuel settings'));
    }

    const data = await response.json();
    return data.data;
}

export async function updateFuelSettings(dto: UpdateFuelSettingsDto, token: string): Promise<FuelSettingsDto> {
    const response = await fetch(`${API_BASE_URL}/fuel-settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(await readError(response, 'Failed to update fuel settings'));
    }

    const data = await response.json();
    return data.data;
}

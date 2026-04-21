import { API_BASE_URL } from '@/config/api';

interface DriverFront {
    id: string;
    fullName: string;
    age: number;
    address: string;
    employmentType: string;
    licenseCategory: string;
    isActive: boolean;
}

export interface AddDriverDto {
    fullName: string;
    birthYear: string;
    address: string;
    driverCategories: string;
    employmentType: string;
}

export interface UpdateDriverDto {
    id: number;
    fullName: string | null;
    birthYear: string;
    address: string | null;
    driverCategory: number;
    employmentType: number;
}

interface PaginatedResponse<T> {
    data: T[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    statusCode: number;
}

export async function getAllDrivers(
    token: string,
    pageNumber: number = 1,
    pageSize: number = 30
): Promise<DriverFront[]> {
    const queryParams = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
    });

    const endpoint = `${API_BASE_URL}/drivers?${queryParams.toString()}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch drivers: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const paginatedResponse: PaginatedResponse<DriverFront> = await response.json();
        return paginatedResponse.data || [];

    } catch (error) {
        console.error("API Call Error in getAllDrivers:", error);
        throw error;
    }
}

export async function addDriver(dto: AddDriverDto, token: string): Promise<void> {
    const endpoint = `${API_BASE_URL}/drivers/add`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add driver');
    }
}

export async function updateDriver(dto: UpdateDriverDto, token: string): Promise<void> {
    const endpoint = `${API_BASE_URL}/drivers`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update driver');
    }
}
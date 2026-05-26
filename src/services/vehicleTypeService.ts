// src/services/vehicleTypeService.ts
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

// Define the expected structure for a single Vehicle Type
interface VehicleType {
    id: string;
    name: string;
    description: string;
}

// Define the expected structure for the paginated API response
interface PaginatedResponse<T> {
    data: T[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    statusCode: number;
}

export interface AddVehicleTypeDto {
    name: string;
    description?: string;
}

/**
 * Fetches vehicle types from the backend API, including required pagination filters.
 * GET http://localhost:5147/api/vehicles?PageNumber=1&PageSize=10
 */
export async function getAllVehicleTypes(
    token: string,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<VehicleType[]> {

    // Construct the query string with the required parameters
    const queryParams = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
    });

    // NOTE: Assuming the endpoint is "api/vehicles"
    const endpoint = `${API_BASE_URL}/vehicle-types?${queryParams.toString()}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,  // ← Add this
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch vehicle types: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const paginatedResponse: PaginatedResponse<VehicleType> = await response.json();

        // Extract and return only the array of vehicle types
        return paginatedResponse.data || [];

    } catch (error) {
        console.error("API Call Error in getAllVehicleTypes:", error);
        throw error;
    }
}

// Vehicle Types
export interface VehicleTypeDto {
    id: number;
    name: string;
    description?: string;
}

export interface UpdateVehicleTypeDto {
    name?: string;
    description?: string;
    capacity?: number;
}

export const getVehicleTypes = async (): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/vehicle-types`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const addVehicleType = async (
    token: string,
    data: AddVehicleTypeDto
): Promise<any> => {
    const response = await axios.post(
        `${API_BASE_URL}/vehicle-types/add`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
};

export const updateVehicleType = async (
    token: string,
    id: number,
    data: { name?: string; description?: string; capacity?: number }
): Promise<any> => {
    const response = await axios.put(
        `${API_BASE_URL}/vehicle-types/${id}`,
        data,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
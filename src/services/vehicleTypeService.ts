// src/services/vehicleTypeService.ts

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

// Retrieve API base URL from environment variables
const API_BASE_URL = "http://192.168.68.123:8080/api";

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
// Assuming your API returns an array of Driver objects
interface DriverFront {
    id: string;
    fullName: string;
    age: number;
    address: string;
    employmentType: string;
    licenseCategory: string; // Backend sends a single string 'Category'
    isActive: boolean;       // Backend sends 'IsActive'
}

export interface AddDriverDto {
    fullName: string;
    birthYear: string; // Will send as "YYYY-MM-DD"
    address: string;
    driverCategories: string; // Backend expects Enum (string from frontend)
    employmentType: string;   // Backend expects Enum (string from frontend)
}

interface PaginatedResponse<T> {
    data: T[]; // The array of items
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    statusCode: number; // Or a similar status field
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Fetches all drivers from the backend API.
 * GET http://localhost:5147/api/drivers
 */
export async function getAllDrivers(
    pageNumber: number = 1,
    pageSize: number = 30
): Promise<DriverFront[]> { // NOTE: Still promises an array to the component

    const queryParams = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
    });

    const endpoint = `${API_BASE_URL}/api/drivers?${queryParams.toString()}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch drivers: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        // 🚨 CRUCIAL CHANGE: Read the entire response object
        const paginatedResponse: PaginatedResponse<DriverFront> = await response.json();

        console.log(paginatedResponse);

        // 🚨 CRUCIAL CHANGE: Return only the 'data' array to the component
        // This array is what drivers.map expects.
        return paginatedResponse.data || [];

    } catch (error) {
        console.error("API Call Error in getAllDrivers:", error);
        throw error;
    }
}

export async function addDriver(dto: AddDriverDto): Promise<void> {
    const endpoint = `${API_BASE_URL}/api/drivers/add`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add driver');
    }
}
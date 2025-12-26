// src/services/userService.ts
import { API_BASE_URL } from "../config";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface UsersResponse {
    statusCode: number;
    data: User[];
    message: string;
}

export async function getUsers(token: string): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch users: ${text}`);
    }

    const response: UsersResponse = await res.json();
    return response.data; // extract the array
}

// src/services/authService.ts
import { API_BASE_URL } from "../config";

interface LoginResponse {
    statusCode: number;
    data: {
        token: string;
    };
    message: string;
}

export async function login(username: string, password: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/login`, { // note /login
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Login failed: ${errorText}`);
    }

    const data: LoginResponse = await res.json();

    if (!data.data?.token) throw new Error("No token returned from login");

    localStorage.setItem("jwtToken", data.data.token);

    return data.data.token;
}

export function getToken(): string | null {
    return localStorage.getItem("jwtToken");
}

export function logout() {
    localStorage.removeItem("jwtToken");
}

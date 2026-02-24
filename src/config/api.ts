// Central API configuration
// Automatically detects the correct API URL based on how you access the frontend

function getApiBaseUrl(): string {
    // Server-side rendering fallback
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://192.168.68.115:8080/api';
    }

    // Client-side: use the same hostname as the frontend
    const host = window.location.hostname;
    return `http://${host}:8080/api`;
}

export const API_BASE_URL = getApiBaseUrl();

// Helper for building endpoints
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
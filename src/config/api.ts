// Central API configuration
// Automatically detects the correct API URL based on how you access the frontend

function getApiBaseUrl(): string {
    // 1. FORCE the environment variable first (Vercel production build)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Server-side rendering fallback if no env variable exists
    if (typeof window === 'undefined') {
        return 'http://62.84.182.181:8080/api';
    }

    // 3. Local development fallback (e.g., localhost)
    const host = window.location.hostname;
    return `http://${host}:8080/api`;
}

export const API_BASE_URL = getApiBaseUrl();

// Helper for building endpoints
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
// Central API configuration
// Change this ONE file when deploying to different environments

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.68.115:8080/api";

// Helper for building endpoints
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
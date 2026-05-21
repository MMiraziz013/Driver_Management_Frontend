import axios from 'axios';

import { API_BASE_URL } from '@/config/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Types
export interface CompanyCategoryDto {
    id: number;
    name: string;
    description?: string;
    displayOrder: number;
    color?: string;
    companyCount: number;
}

export interface CreateCompanyCategoryDto {
    name: string;
    description?: string;
    displayOrder: number;
    color?: string;
}

export interface UpdateCompanyCategoryDto {
    name?: string;
    description?: string;
    displayOrder?: number;
    color?: string;
}

export interface CompanyDto {
    id: number;
    name: string;
    companyCategoryId?: number;
    categoryName?: string;
    categoryColor?: string;
    aliases?: string;
    notes?: string;
    isActive: boolean;
    firstSeenAt: string;
}

export interface UpdateCompanyDto {
    companyCategoryId?: number | null;
    aliases?: string;
    notes?: string;
    isActive?: boolean;
}

export interface BulkAssignCategoryDto {
    companyIds: number[];
    categoryId: number;
}

export interface ApiResponse<T> {
    statusCode: number;
    message?: string;
    data?: T;
    errors?: string[];
}

// Category APIs
export const getCompanyCategories = async (): Promise<ApiResponse<CompanyCategoryDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/companies/categories`, getAuthHeaders());
    return response.data;
};

export const createCompanyCategory = async (dto: CreateCompanyCategoryDto): Promise<ApiResponse<CompanyCategoryDto>> => {
    const response = await axios.post(`${API_BASE_URL}/companies/categories`, dto, getAuthHeaders());
    return response.data;
};

export const updateCompanyCategory = async (id: number, dto: UpdateCompanyCategoryDto): Promise<ApiResponse<CompanyCategoryDto>> => {
    const response = await axios.put(`${API_BASE_URL}/companies/categories/${id}`, dto, getAuthHeaders());
    return response.data;
};

export const deleteCompanyCategory = async (id: number): Promise<ApiResponse<string>> => {
    const response = await axios.delete(`${API_BASE_URL}/companies/categories/${id}`, getAuthHeaders());
    return response.data;
};

// Company APIs
export const getAllCompanies = async (): Promise<ApiResponse<CompanyDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/companies`, getAuthHeaders());
    return response.data;
};

export const getUncategorizedCompanies = async (): Promise<ApiResponse<CompanyDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/companies/uncategorized`, getAuthHeaders());
    return response.data;
};

export const updateCompany = async (id: number, dto: UpdateCompanyDto): Promise<ApiResponse<CompanyDto>> => {
    const response = await axios.put(`${API_BASE_URL}/companies/${id}`, dto, getAuthHeaders());
    return response.data;
};

export const bulkAssignCategory = async (dto: BulkAssignCategoryDto): Promise<ApiResponse<string>> => {
    const response = await axios.post(`${API_BASE_URL}/companies/bulk-assign`, dto, getAuthHeaders());
    return response.data;
};

export const syncCompaniesFromTransactions = async (): Promise<ApiResponse<string>> => {
    const response = await axios.post(`${API_BASE_URL}/companies/sync`, {}, getAuthHeaders());
    return response.data;
};
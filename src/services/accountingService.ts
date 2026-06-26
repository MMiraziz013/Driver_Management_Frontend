import axios from 'axios';

import { API_BASE_URL } from '@/config/api';
// ============ DTOs ============

export interface ExchangeRateDto {
    id: number;
    year: number;
    rate: number;
    updatedAt: string;
    updatedBy?: string;
}

export interface UpdateExchangeRateDto {
    year: number;
    rate: number;
}

export interface AccountingReportDto {
    id: number;
    year: number;
    month: number;
    monthName: string;
    fileName?: string;
    transactionCount: number;
    totalAmount: number;
    uploadedAt: string;
    uploadedBy?: string;
}

export interface AccountingUploadResultDto {
    year: number;
    month: number;
    transactionsImported: number;
    transactionsSkipped: number;
    totalAmount: number;
    warnings: string[];
}

export interface AnalysisReportRequestDto {
    years: number[];
    months?: number[]; 
}

export interface AnalysisMonthRowDto {
    month: number;
    monthName: string;
    amountsByYear: Record<number, number>;
    isSelected: boolean;
}

export interface AnalysisTotalsDto {
    totalUsdByYear: Record<number, number>;
    totalUzsByYear: Record<number, number>;
    fullYearUsdByYear: Record<number, number>;
    fullYearUzsByYear: Record<number, number>;
}

export interface AnalysisYearComparisonDto {
    baseYear: number;
    compareYear: number;
    monthlyPercentageChange: Record<number, number>;
    totalPercentageChange: number;
    fullYearPercentageChange: number;
}

export interface AnalysisReportDto {
    years: number[];
    months: number[];
    monthlyData: AnalysisMonthRowDto[];
    totals: AnalysisTotalsDto;
    yearComparisons: AnalysisYearComparisonDto[];
    exchangeRates: Record<number, number>;
    generatedAt: string;
}

export interface ApiResponse<T> {
    statusCode: number;
    message?: string;
    data?: T;
    errors?: string[];
}

// Car Revenue Report
export interface CarRevenueReportRequestDto {
    year: number;
    months?: number[];
}

export interface CarRevenueRowDto {
    car: string;
    category: string;
    totalAmount: number;
    averageUzs: number;
    averageUsd: number;
    carCostUsd: number;
    planUsd: number;
    planMonths: number;
    monthlyAmounts: Record<number, number>;
    portionPercent: number;
    tripCount: number;
}

export interface CarRevenueTotalsDto {
    totalAmount: number;
    averageUzs: number;
    averageUsd: number;
    totalCarCostUsd: number;
    totalPlanUsd: number;
    monthlyAmounts: Record<number, number>;
    totalTripCount: number;
}

export interface CarRevenueReportDto {
    year: number;
    months: number[];
    monthNames: string[];
    exchangeRate: number;
    rows: CarRevenueRowDto[];
    totals: CarRevenueTotalsDto;
    generatedAt: string;
}

// Farm Out Report
export interface FarmOutReportRequestDto {
    year: number;
    months?: number[];
}

export interface FarmOutRowDto {
    carType: string;
    total: number;
    totalUsd: number;
    carCostUsd: number;
    monthlyAmounts: Record<number, number>;
    portionPercent: number;
    tripCount: number;
}

export interface FarmOutTotalsDto {
    total: number;
    totalUsd: number;
    totalCarCostUsd: number;
    monthlyAmounts: Record<number, number>;
    totalTripCount: number;
}

export interface FarmOutReportDto {
    year: number;
    months: number[];
    monthNames: string[];
    exchangeRate: number;
    rows: FarmOutRowDto[];
    totals: FarmOutTotalsDto;
    generatedAt: string;
}


// Company Revenue Report
export interface CompanyRevenueReportRequestDto {
    year: number;
    months?: number[];
}

export interface CategoryRevenueRowDto {
    categoryName: string;
    revenue: number;
    portionPercent: number;
    companyCount: number;
}

export interface CompanyRevenueRowDto {
    companyName: string;
    categoryName: string;
    total: number;
    portionPercent: number;
    monthlyAmounts: Record<number, number>;
    tripCount: number;
}

export interface CompanyRevenueTotalsDto {
    total: number;
    monthlyAmounts: Record<number, number>;
    totalTripCount: number;
}

export interface CompanyRevenueReportDto {
    year: number;
    months: number[];
    monthNames: string[];
    exchangeRate: number;
    categoryAnalysis: CategoryRevenueRowDto[];
    companyRows: CompanyRevenueRowDto[];
    totals: CompanyRevenueTotalsDto;
    generatedAt: string;
}

// ============ API Functions ============

export const generateFarmOutReport = async (request: FarmOutReportRequestDto): Promise<ApiResponse<FarmOutReportDto>> => {
    const response = await axios.post(`${API_BASE_URL}/accounting/farm-out`, request, getAuthHeaders());
    return response.data;
};

export const exportFarmOutReport = async (request: FarmOutReportRequestDto): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_BASE_URL}/accounting/farm-out/export`,
        request,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        }
    );
    return response.data;
};



export const generateCarRevenueReport = async (request: CarRevenueReportRequestDto): Promise<ApiResponse<CarRevenueReportDto>> => {
    const response = await axios.post(`${API_BASE_URL}/accounting/car-revenue`, request, getAuthHeaders());
    return response.data;
};

export const exportCarRevenueReport = async (request: CarRevenueReportRequestDto): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_BASE_URL}/accounting/car-revenue/export`,
        request,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        }
    );
    return response.data;
};


const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Exchange Rates
export const getExchangeRates = async (): Promise<ApiResponse<ExchangeRateDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/exchange-rates`, getAuthHeaders());
    return response.data;
};

export const getExchangeRateByYear = async (year: number): Promise<ApiResponse<ExchangeRateDto>> => {
    const response = await axios.get(`${API_BASE_URL}/exchange-rates/${year}`, getAuthHeaders());
    return response.data;
};

export const saveExchangeRate = async (dto: UpdateExchangeRateDto): Promise<ApiResponse<ExchangeRateDto>> => {
    const response = await axios.post(`${API_BASE_URL}/exchange-rates`, dto, getAuthHeaders());
    return response.data;
};

export const deleteExchangeRate = async (year: number): Promise<ApiResponse<string>> => {
    const response = await axios.delete(`${API_BASE_URL}/exchange-rates/${year}`, getAuthHeaders());
    return response.data;
};

// Accounting Reports (Uploads)
export const getAccountingReports = async (): Promise<ApiResponse<AccountingReportDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/accounting/reports`, getAuthHeaders());
    return response.data;
};

export const getAccountingReportsByYear = async (year: number): Promise<ApiResponse<AccountingReportDto[]>> => {
    const response = await axios.get(`${API_BASE_URL}/accounting/reports/${year}`, getAuthHeaders());
    return response.data;
};

export const uploadAccountingReport = async (
    file: File,
    year: number,
    month: number
): Promise<ApiResponse<AccountingUploadResultDto>> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_BASE_URL}/accounting/upload/${year}/${month}`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
};

export const deleteAccountingReport = async (year: number, month: number): Promise<ApiResponse<string>> => {
    const response = await axios.delete(`${API_BASE_URL}/accounting/reports/${year}/${month}`, getAuthHeaders());
    return response.data;
};

// Analysis Report
export const generateAnalysisReport = async (request: AnalysisReportRequestDto): Promise<ApiResponse<AnalysisReportDto>> => {
    const response = await axios.post(`${API_BASE_URL}/accounting/analysis`, request, getAuthHeaders());
    return response.data;
};

export const exportAnalysisReport = async (request: AnalysisReportRequestDto): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_BASE_URL}/accounting/analysis/export`,
        request,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        }
    );
    return response.data;
};


// Companies Report
export const generateCompanyRevenueReport = async (request: CompanyRevenueReportRequestDto): Promise<ApiResponse<CompanyRevenueReportDto>> => {
    const response = await axios.post(`${API_BASE_URL}/accounting/company-revenue`, request, getAuthHeaders());
    return response.data;
};

export const exportCompanyRevenueReport = async (request: CompanyRevenueReportRequestDto): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_BASE_URL}/accounting/company-revenue/export`,
        request,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        }
    );
    return response.data;
};
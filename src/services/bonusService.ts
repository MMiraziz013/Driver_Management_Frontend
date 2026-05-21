import { API_BASE_URL } from '@/config/api';

// Enums
export enum BonusCalculationMethod {
    QuantityBased = 0,
    DurationBased = 1,
    RoundTripBased = 2,
    FieldTripBased = 3
}

export const CalculationMethodLabels: Record<BonusCalculationMethod, string> = {
    [BonusCalculationMethod.QuantityBased]: 'Quantity Based (per trip)',
    [BonusCalculationMethod.DurationBased]: 'Duration Based (time brackets)',
    [BonusCalculationMethod.RoundTripBased]: 'Round Trip (per trip)',
    [BonusCalculationMethod.FieldTripBased]: 'Field Trip (duration + daily)'
};

// DTOs
export interface BonusSettingsDto {
    id: number;
    name: string;
    isActive: boolean;
    // Standard Quantity rates (Transfer, To Airport, To Railway)
    quantityPremiumVehicleRate: number;
    quantityStandardVehicleRate: number;
    // From Airport rates
    quantityFromAirportPremiumRate: number;
    quantityFromAirportStandardRate: number;
    // From Railway rates
    quantityFromRailwayPremiumRate: number;
    quantityFromRailwayStandardRate: number;
    // Round Trip
    roundTripPremiumVehicleRate: number;
    roundTripStandardVehicleRate: number;
    // Duration rates
    durationUnder2HoursRate: number;
    durationUnder4HoursRate: number;
    duration4To6HoursRate: number;
    duration6To8HoursRate: number;
    duration8To10HoursRate: number;
    duration10To12HoursRate: number;
    duration12To14HoursRate: number;
    durationOver14HoursRate: number;
    // Field Trip
    fieldTripDailyRate: number;
    premiumVehicleTypes: string[];
}

export interface UpdateBonusSettingsDto {
    quantityPremiumVehicleRate?: number;
    quantityStandardVehicleRate?: number;
    quantityFromAirportPremiumRate?: number;
    quantityFromAirportStandardRate?: number;
    quantityFromRailwayPremiumRate?: number;
    quantityFromRailwayStandardRate?: number;
    roundTripPremiumVehicleRate?: number;
    roundTripStandardVehicleRate?: number;
    durationUnder2HoursRate?: number;
    durationUnder4HoursRate?: number;
    duration4To6HoursRate?: number;
    duration6To8HoursRate?: number;
    duration8To10HoursRate?: number;
    duration10To12HoursRate?: number;
    duration12To14HoursRate?: number;
    durationOver14HoursRate?: number;
    fieldTripDailyRate?: number;
    premiumVehicleTypes?: string[];
}

export interface ServiceTypeBonusBreakdownDto {
    serviceTypeName: string;
    calculationMethod: string;
    tripCount: number;
    totalHours: number;
    totalDays: number;
    bonusAmount: number;
    premiumVehicleTrips: number;
    standardVehicleTrips: number;
    tripsUnder2Hours: number;
    tripsUnder4Hours: number;
    trips4To6Hours: number;
    trips6To8Hours: number;
    trips8To10Hours: number;
    trips10To12Hours: number;
    trips12To14Hours: number;
    tripsOver14Hours: number;
}

export interface ServiceTypeBonusConfigDto {
    id: number;
    serviceTypeId: number;
    serviceTypeName: string;
    calculationMethod: string;  // Changed from BonusCalculationMethod to string
    calculationMethodName: string;
}

export interface UpdateServiceTypeBonusConfigDto {
    serviceTypeId: number;
    calculationMethod: BonusCalculationMethod;
}

export interface BonusCalculationRequestDto {
    periodIds: number[];
}

export interface TripStatDto {
    confNumber: string;
    date: string;
    serviceTypeName: string;
    companyName: string;
    vehicleInfo: string;
    durationHours: number;
    distanceKm: number;
}

export interface DriverBonusResultDto {
    driverName: string;
    totalBonus: number;
    totalHoursWorked: number;
    totalTrips: number;
    totalDaysWorked: number;
    averageHoursPerDay: number;
    serviceTypeBreakdowns: ServiceTypeBonusBreakdownDto[];
    longestTrip: TripStatDto | null;
    furthestTrip: TripStatDto | null;
}

export interface BonusCalculationResultDto {
    periodIds: number[];
    periodNames: string;
    calculatedAt: string;
    grandTotal: number;
    totalDrivers: number;
    totalTrips: number;
    totalHoursWorked: number;
    driverResults: DriverBonusResultDto[];
}

// API Functions

export async function getBonusSettings(token: string): Promise<BonusSettingsDto> {
    const response = await fetch(`${API_BASE_URL}/bonus-settings`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch bonus settings');
    }

    const data = await response.json();
    return data.data;
}

export async function updateBonusSettings(dto: UpdateBonusSettingsDto, token: string): Promise<BonusSettingsDto> {
    const response = await fetch(`${API_BASE_URL}/bonus-settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error('Failed to update bonus settings');
    }

    const data = await response.json();
    return data.data;
}

export async function getServiceTypeConfigs(token: string): Promise<ServiceTypeBonusConfigDto[]> {
    const response = await fetch(`${API_BASE_URL}/bonus-settings/service-types`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch service type configs');
    }

    const data = await response.json();
    return data.data || [];
}

export async function updateServiceTypeConfig(dto: UpdateServiceTypeBonusConfigDto, token: string): Promise<ServiceTypeBonusConfigDto> {
    const response = await fetch(`${API_BASE_URL}/bonus-settings/service-types`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error('Failed to update service type config');
    }

    const data = await response.json();
    return data.data;
}

export async function initializeDefaultConfigs(token: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/bonus-settings/initialize`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to initialize configs');
    }

    const data = await response.json();
    return data.data;
}

export async function calculateBonuses(request: BonusCalculationRequestDto, token: string): Promise<BonusCalculationResultDto> {
    const response = await fetch(`${API_BASE_URL}/bonuses/calculate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Failed to calculate bonuses');
    }

    const data = await response.json();
    return data.data;
}

export async function exportBonusesToExcel(request: BonusCalculationRequestDto, token: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/bonuses/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Failed to export bonuses');
    }

    return response.blob();
}

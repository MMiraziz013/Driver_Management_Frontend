import React, { useState, useEffect } from 'react';
import { Save, Loader2, RefreshCw, Settings, Car, Clock, DollarSign, Plus, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
    getBonusSettings,
    updateBonusSettings,
    getServiceTypeConfigs,
    updateServiceTypeConfig,
    BonusSettingsDto,
    ServiceTypeBonusConfigDto,
    BonusCalculationMethod,
    CalculationMethodLabels
} from '@/services/bonusService';

export function BonusSettingsPage() {
    const { token } = useAuth();

    const [settings, setSettings] = useState<BonusSettingsDto | null>(null);
    const [serviceTypeConfigs, setServiceTypeConfigs] = useState<ServiceTypeBonusConfigDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [newPremiumVehicle, setNewPremiumVehicle] = useState('');

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);

        try {
            const [settingsData, configsData] = await Promise.all([
                getBonusSettings(token),
                getServiceTypeConfigs(token)
            ]);
            console.log('Service Type Configs:', configsData);  // ADD THIS
            console.log('First config calculationMethod:', configsData[0]?.calculationMethod, typeof configsData[0]?.calculationMethod);  // ADD THIS
            setSettings(settingsData);
            setServiceTypeConfigs(configsData);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (field: keyof BonusSettingsDto, value: number) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    const handleSaveSettings = async () => {
        if (!token || !settings) return;
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const updated = await updateBonusSettings({
                quantityPremiumVehicleRate: settings.quantityPremiumVehicleRate,
                quantityStandardVehicleRate: settings.quantityStandardVehicleRate,
                quantityFromAirportPremiumRate: settings.quantityFromAirportPremiumRate,
                quantityFromAirportStandardRate: settings.quantityFromAirportStandardRate,
                quantityFromRailwayPremiumRate: settings.quantityFromRailwayPremiumRate,
                quantityFromRailwayStandardRate: settings.quantityFromRailwayStandardRate,
                roundTripPremiumVehicleRate: settings.roundTripPremiumVehicleRate,
                roundTripStandardVehicleRate: settings.roundTripStandardVehicleRate,
                durationUnder2HoursRate: settings.durationUnder2HoursRate,
                durationUnder4HoursRate: settings.durationUnder4HoursRate,
                duration4To6HoursRate: settings.duration4To6HoursRate,
                duration6To8HoursRate: settings.duration6To8HoursRate,
                duration8To10HoursRate: settings.duration8To10HoursRate,
                duration10To12HoursRate: settings.duration10To12HoursRate,
                duration12To14HoursRate: settings.duration12To14HoursRate,
                durationOver14HoursRate: settings.durationOver14HoursRate,
                fieldTripDailyRate: settings.fieldTripDailyRate,
                premiumVehicleTypes: settings.premiumVehicleTypes
            }, token);
            setSettings(updated);
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleServiceTypeChange = async (serviceTypeId: number, method: BonusCalculationMethod) => {
        if (!token) return;

        try {
            await updateServiceTypeConfig({ serviceTypeId, calculationMethod: method }, token);

            // Map enum back to string for local state
            const methodNames: Record<BonusCalculationMethod, string> = {
                [BonusCalculationMethod.QuantityBased]: 'QuantityBased',
                [BonusCalculationMethod.DurationBased]: 'DurationBased',
                [BonusCalculationMethod.RoundTripBased]: 'RoundTripBased',
                [BonusCalculationMethod.FieldTripBased]: 'FieldTripBased',
            };

            setServiceTypeConfigs(prev => prev.map(c =>
                c.serviceTypeId === serviceTypeId
                    ? { ...c, calculationMethod: methodNames[method], calculationMethodName: methodNames[method] }
                    : c
            ));
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const addPremiumVehicle = () => {
        if (!settings || !newPremiumVehicle.trim()) return;
        if (settings.premiumVehicleTypes.includes(newPremiumVehicle.trim())) return;

        setSettings({
            ...settings,
            premiumVehicleTypes: [...settings.premiumVehicleTypes, newPremiumVehicle.trim()]
        });
        setNewPremiumVehicle('');
    };

    const removePremiumVehicle = (vehicle: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            premiumVehicleTypes: settings.premiumVehicleTypes.filter(v => v !== vehicle)
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bonus Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure calculation rates and methods for driver bonuses
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save All Settings
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {successMessage}
                </div>
            )}

            {settings && (
                <div className="space-y-6">
                    {/* Premium Vehicle Types */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Car className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Premium Vehicle Types</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            These vehicle types receive higher bonus rates
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {settings.premiumVehicleTypes.map(vehicle => (
                                <span
                                    key={vehicle}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                                >
                                    {vehicle}
                                    <button
                                        onClick={() => removePremiumVehicle(vehicle)}
                                        className="hover:text-indigo-900"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPremiumVehicle}
                                onChange={e => setNewPremiumVehicle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addPremiumVehicle()}
                                placeholder="Add vehicle type (e.g., Toyota Coaster)"
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={addPremiumVehicle}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Transfer & To Rates</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Fixed rate per trip (Transfer, To Airport, To Railway Station)
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Premium Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityPremiumVehicleRate}
                                    onChange={e => handleSettingsChange('quantityPremiumVehicleRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Standard Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityStandardVehicleRate}
                                    onChange={e => handleSettingsChange('quantityStandardVehicleRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* From Airport Rates */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-orange-600" />
                            <h2 className="text-lg font-semibold text-slate-900">From Airport Rates</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Higher rate for airport pickup trips (From Airport)
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Premium Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityFromAirportPremiumRate}
                                    onChange={e => handleSettingsChange('quantityFromAirportPremiumRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Standard Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityFromAirportStandardRate}
                                    onChange={e => handleSettingsChange('quantityFromAirportStandardRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* From Railway Station Rates */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-red-600" />
                            <h2 className="text-lg font-semibold text-slate-900">From Railway Station Rates</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Rate for railway station pickup trips (From Railway Station)
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Premium Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityFromRailwayPremiumRate}
                                    onChange={e => handleSettingsChange('quantityFromRailwayPremiumRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Standard Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.quantityFromRailwayStandardRate}
                                    onChange={e => handleSettingsChange('quantityFromRailwayStandardRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Round Trip Rates */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Round Trip Rates</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Fixed rate per round trip
                        </p>

                        {/* Exception note */}
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700">
                                <strong>Exception:</strong> Sierra Nevada + MB Sprinter Round Trips use hourly (duration-based) rates instead.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Premium Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.roundTripPremiumVehicleRate}
                                    onChange={e => handleSettingsChange('roundTripPremiumVehicleRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Standard Vehicle Rate
                                </label>
                                <input
                                    type="number"
                                    value={settings.roundTripStandardVehicleRate}
                                    onChange={e => handleSettingsChange('roundTripStandardVehicleRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Duration-Based Rates */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Duration-Based Rates</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Rates based on trip duration (Customer Itinerary, Field Trip)
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Under 2 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.durationUnder2HoursRate}
                                    onChange={e => handleSettingsChange('durationUnder2HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    2-4 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.durationUnder4HoursRate}
                                    onChange={e => handleSettingsChange('durationUnder4HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    4-6 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.duration4To6HoursRate}
                                    onChange={e => handleSettingsChange('duration4To6HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    6-8 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.duration6To8HoursRate}
                                    onChange={e => handleSettingsChange('duration6To8HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    8-10 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.duration8To10HoursRate}
                                    onChange={e => handleSettingsChange('duration8To10HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    10-12 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.duration10To12HoursRate}
                                    onChange={e => handleSettingsChange('duration10To12HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    12-14 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.duration12To14HoursRate}
                                    onChange={e => handleSettingsChange('duration12To14HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Over 14 hours
                                </label>
                                <input
                                    type="number"
                                    value={settings.durationOver14HoursRate}
                                    onChange={e => handleSettingsChange('durationOver14HoursRate', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Field Trip Daily Rate */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Field Trip Daily Rate</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Additional daily rate on top of duration-based rate
                        </p>

                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Per Day Rate
                            </label>
                            <input
                                type="number"
                                value={settings.fieldTripDailyRate}
                                onChange={e => handleSettingsChange('fieldTripDailyRate', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Service Type Calculation Methods */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Service Type Calculation Methods</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Choose which calculation method applies to each service type
                        </p>

                        <div className="space-y-3">
                            {serviceTypeConfigs.map(config => (
                                <div
                                    key={config.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                    <span className="font-medium text-slate-900">{config.serviceTypeName}</span>
                                    <select
                                        id={`calc-method-${config.serviceTypeId}`}
                                        name={`calc-method-${config.serviceTypeId}`}
                                        value={config.calculationMethod}
                                        onChange={e => {
                                            const methodMap: Record<string, BonusCalculationMethod> = {
                                                'QuantityBased': BonusCalculationMethod.QuantityBased,
                                                'DurationBased': BonusCalculationMethod.DurationBased,
                                                'RoundTripBased': BonusCalculationMethod.RoundTripBased,
                                                'FieldTripBased': BonusCalculationMethod.FieldTripBased,
                                            };
                                            handleServiceTypeChange(config.serviceTypeId, methodMap[e.target.value]);
                                        }}
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="QuantityBased">Quantity Based (per trip)</option>
                                        <option value="DurationBased">Duration Based (time brackets)</option>
                                        <option value="RoundTripBased">Round Trip (per trip)</option>
                                        <option value="FieldTripBased">Field Trip (duration + daily)</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

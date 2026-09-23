import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
    BonusCalculationExceptionDto,
    BonusCalculationMethodName,
    CalculationMethodNameLabels,
    SaveBonusCalculationExceptionDto,
    createBonusException,
    updateBonusException,
} from '@/services/bonusService';

interface Option {
    id: number | string;
    name: string;
}

interface BonusExceptionModalProps {
    isOpen: boolean;
    exception: BonusCalculationExceptionDto | null; // null = create
    serviceTypes: Option[];
    vehicleTypes: Option[];
    onClose: () => void;
    onSuccess: () => void;
}

const inputClass =
    'w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none';

export function BonusExceptionModal({
    isOpen,
    exception,
    serviceTypes,
    vehicleTypes,
    onClose,
    onSuccess,
}: BonusExceptionModalProps) {
    const { token } = useAuth();

    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [companyNameContains, setCompanyNameContains] = useState('');
    const [serviceTypeId, setServiceTypeId] = useState<number | ''>('');
    const [calculationMethod, setCalculationMethod] = useState<BonusCalculationMethodName>('DurationBased');
    const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
    const [locationKeywords, setLocationKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when opened
    useEffect(() => {
        if (!isOpen) return;
        setName(exception?.name ?? '');
        setIsActive(exception?.isActive ?? true);
        setCompanyNameContains(exception?.companyNameContains ?? '');
        setServiceTypeId(exception?.serviceTypeId ?? '');
        setCalculationMethod(exception?.calculationMethod ?? 'DurationBased');
        setSelectedVehicleTypes(exception?.vehicleTypes ?? []);
        setLocationKeywords(exception?.locationKeywords ?? []);
        setKeywordInput('');
        setErrors([]);
    }, [isOpen, exception]);

    if (!isOpen) return null;

    const toggleVehicleType = (typeName: string) => {
        setSelectedVehicleTypes((prev) =>
            prev.includes(typeName) ? prev.filter((t) => t !== typeName) : [...prev, typeName]
        );
    };

    const addKeyword = (raw: string) => {
        const keyword = raw.trim();
        if (!keyword) return;
        setLocationKeywords((prev) =>
            prev.some((k) => k.toLowerCase() === keyword.toLowerCase()) ? prev : [...prev, keyword]
        );
        setKeywordInput('');
    };

    const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyword(keywordInput);
        } else if (e.key === 'Backspace' && !keywordInput && locationKeywords.length > 0) {
            setLocationKeywords((prev) => prev.slice(0, -1));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (serviceTypeId === '') {
            setErrors(['Service type is required']);
            return;
        }

        // Include any keyword still sitting in the input
        const pending = keywordInput.trim();
        const keywords =
            pending && !locationKeywords.some((k) => k.toLowerCase() === pending.toLowerCase())
                ? [...locationKeywords, pending]
                : locationKeywords;

        const dto: SaveBonusCalculationExceptionDto = {
            name: name.trim(),
            isActive,
            companyNameContains: companyNameContains.trim(),
            serviceTypeId,
            calculationMethod,
            vehicleTypes: selectedVehicleTypes,
            locationKeywords: keywords,
        };

        setIsSubmitting(true);
        setErrors([]);
        try {
            if (exception) {
                await updateBonusException(exception.id, dto, token);
            } else {
                await createBonusException(dto, token);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setErrors((err instanceof Error ? err.message : 'An error occurred').split(', '));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">
                        {exception ? 'Edit Exception' : 'Add Exception'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                            {errors.map((err) => (
                                <p key={err}>{err}</p>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            className={inputClass}
                            placeholder="e.g. Sierra Nevada - Chirchik"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Company name contains <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={companyNameContains}
                            onChange={(e) => setCompanyNameContains(e.target.value)}
                            maxLength={200}
                            className={inputClass}
                            placeholder="e.g. Sierra Nevada"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Case-insensitive match on the trip&apos;s company name.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Service type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={serviceTypeId}
                                onChange={(e) => setServiceTypeId(e.target.value ? Number(e.target.value) : '')}
                                className={inputClass}
                                required
                            >
                                <option value="">Select...</option>
                                {serviceTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Calculate as <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={calculationMethod}
                                onChange={(e) => setCalculationMethod(e.target.value as BonusCalculationMethodName)}
                                className={inputClass}
                            >
                                {(Object.keys(CalculationMethodNameLabels) as BonusCalculationMethodName[]).map((method) => (
                                    <option key={method} value={method}>
                                        {CalculationMethodNameLabels[method]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700">Vehicle types</label>
                            {selectedVehicleTypes.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedVehicleTypes([])}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Clear (all types)
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {vehicleTypes.map((vt) => {
                                const selected = selectedVehicleTypes.includes(vt.name);
                                return (
                                    <button
                                        type="button"
                                        key={vt.id}
                                        onClick={() => toggleVehicleType(vt.name)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            selected
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {vt.name}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {selectedVehicleTypes.length === 0
                                ? 'All vehicle types'
                                : `${selectedVehicleTypes.length} selected`}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Route keywords</label>
                        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                            {locationKeywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                                >
                                    {keyword}
                                    <button
                                        type="button"
                                        onClick={() => setLocationKeywords((prev) => prev.filter((k) => k !== keyword))}
                                        className="text-indigo-400 hover:text-indigo-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleKeywordKeyDown}
                                onBlur={() => addKeyword(keywordInput)}
                                className="flex-1 min-w-[8rem] outline-none text-slate-900 py-0.5"
                                placeholder={locationKeywords.length === 0 ? 'e.g. Chirchik, then Enter' : ''}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {locationKeywords.length === 0
                                ? 'Any route'
                                : 'Matches if any PU/ST/DO route point contains one of these (case-insensitive).'}
                        </p>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : exception ? (
                                'Save Changes'
                            ) : (
                                'Create Exception'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

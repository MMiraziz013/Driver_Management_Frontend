import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import { API_BASE_URL } from '@/config/api';

interface ServiceType {
    id: number;
    name: string;
    description: string | null;
}

interface EditServiceTypeModalProps {
    isOpen: boolean;
    serviceType: ServiceType | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditServiceTypeModal({ isOpen, serviceType, onClose, onSuccess }: EditServiceTypeModalProps) {
    const authFetch = useAuthFetch();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when serviceType changes
    useEffect(() => {
        if (serviceType) {
            setName(serviceType.name || '');
            setDescription(serviceType.description || '');
        }
    }, [serviceType]);

    if (!isOpen || !serviceType) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            id: serviceType.id,
            name: name.trim() || null,
            description: description.trim() || null,
        };

        try {
            const response = await authFetch(`${API_BASE_URL}/service-type`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.message || 'Failed to update service type'}`);
            }
        } catch (error) {
            console.error('Error updating service type:', error);
            alert('Connection error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Edit Service Type</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            placeholder="e.g. Oil Change"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                            placeholder="Optional description of this service type..."
                        />
                    </div>

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
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
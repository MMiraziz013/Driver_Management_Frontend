import React from 'react';
import { User, Bell, Lock, Globe, CreditCard } from 'lucide-react';

export function SettingsPage() {
    return (
        <div>
            <h1 className="text-slate-900 mb-6">Settings</h1>

            <div className="space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-slate-900">Profile Settings</h2>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Manage your personal information and preferences.
                    </p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        Edit Profile
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-slate-900">Notifications</h2>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Configure how you receive notifications and alerts.
                    </p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        Manage Notifications
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-slate-900">Security</h2>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Update your password and security preferences.
                    </p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        Security Settings
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-slate-900">Language & Region</h2>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Set your preferred language and regional settings.
                    </p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        Change Language
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-slate-900">Billing</h2>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Manage your subscription and payment methods.
                    </p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        View Billing
                    </button>
                </div>
            </div>
        </div>
    );
}

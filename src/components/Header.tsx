import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { User, LogOut, ChevronDown, Shield, Eye } from 'lucide-react';

export function Header() {
    const { user, logout, canManage } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        if (confirm('Are you sure you want to sign out?')) {
            logout();
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            {/* Left side - Logo/Title */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FM</span>
                </div>
                <span className="font-semibold text-gray-900">Fleet Management</span>
            </div>

            {/* Right side - User info */}
            <div className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username || 'User'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                {canManage() ? (
                                    <>
                                        <Shield className="w-3 h-3" />
                                        {user?.role || 'User'}
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-3 h-3" />
                                        View Only
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowUserMenu(false)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email}
                                </p>
                            </div>

                            {/* Role Badge */}
                            <div className="px-4 py-2 border-b border-gray-100">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                    canManage()
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {canManage() ? (
                                        <>
                                            <Shield className="w-3 h-3" />
                                            {user?.role || 'Manager'}
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-3 h-3" />
                                            View Only
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
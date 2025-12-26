import React from 'react';
import { User } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <div className="flex items-center gap-2 text-slate-600">
                <User className="w-5 h-5" />
                <span>John Doe</span>
            </div>

            <div className="flex gap-3">
                <button className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
                    Login
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Sign up
                </button>
            </div>
        </header>
    );
}

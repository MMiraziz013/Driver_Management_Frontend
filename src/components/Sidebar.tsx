// @/components/Sidebar.tsx (Re-injecting your original styles)

"use client";

import React from 'react';
import { Car, Users, Truck, FileText, Settings, PanelLeftIcon } from 'lucide-react';

// Import structural components and hooks from SidebarBase.tsx
import {
    useSidebar,
    SidebarTrigger,
    SidebarProvider,
    // Add SidebarInset here so we can re-export it
    SidebarInset
} from './SidebarBase';

// Import necessary UI components
import { cn } from './ui/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { useIsMobile } from './ui/use-mobile';

// --- YOUR ORIGINAL COMPONENT INTERFACE ---
type Page = 'drivers' | 'vehicle-types' | 'cars' | 'reports' | 'settings';

interface SidebarProps {
    currentPage: Page;
    onPageChange: (page: Page) => void;
}

// --- SidebarMenuContent (Re-using your original styles) ---
function SidebarMenuContent({ currentPage, onPageChange }: SidebarProps) {
    const navItems = [
        { id: 'drivers' as Page, label: 'Drivers', icon: Users },
        { id: 'vehicle-types' as Page, label: 'Vehicle Types', icon: Truck },
        { id: 'cars' as Page, label: 'Cars', icon: Car },
        { id: 'reports' as Page, label: 'Reports', icon: FileText },
    ];

    // We remove the complex structural components like SidebarHeader and SidebarMenu
    // and replace them with your original divs and nav elements with YOUR preferred styling.

    return (
        // The outer div container is now the full height of the sheet/static sidebar
        <div className="flex flex-col h-full bg-white">

            {/* Header/Logo Area */}
            <div className="p-6 border-b border-slate-200 shrink-0">
                <div className="w-32 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                    <img
                        src="/logo.png"
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Main Navigation Area */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'hover:bg-slate-50',
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer/Settings Area */}
            <div className="p-4 border-t border-slate-200 shrink-0">
                <button
                    onClick={() => onPageChange('settings')}
                    className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600',
                        currentPage === 'settings'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'hover:bg-slate-50',
                    )}
                >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    );
}

// --- YOUR MAIN EXPORTED SIDEBAR COMPONENT (Now correctly connected to state) ---
export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    const isMobile = useIsMobile();
    const { openMobile, setOpenMobile } = useSidebar();

    if (isMobile) {
        return (
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetContent
                    side="left"
                    className="w-[18rem] p-0 bg-white"
                >
                    {/* FIX: Ensure the SheetTitle is directly rendered.
                        We can use SheetHeader to wrap the title and description, 
                        and use sr-only to hide it visually while keeping it for screen readers. 
                        The accessibility warning means the DialogContent isn't finding its title 
                        link, even if it's visually hidden.
                    */}
                    <SheetHeader className="sr-only">
                        {/* Ensure SheetTitle is the proper component */}
                        <SheetTitle>Main Navigation Menu</SheetTitle>
                        {/* SheetDescription is optional, remove it if it still causes warnings */}
                    </SheetHeader>

                    {/* Render your actual content */}
                    <SidebarMenuContent
                        currentPage={currentPage}
                        onPageChange={(page) => {
                            onPageChange(page);
                            setOpenMobile(false);
                        }}
                    />
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop View: Render your static sidebar
    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <SidebarMenuContent currentPage={currentPage} onPageChange={onPageChange} />
        </div>
    );
}

// Re-export structural components for app/page.tsx
export { SidebarTrigger, SidebarProvider, SidebarInset };
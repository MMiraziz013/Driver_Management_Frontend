'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ModalShellProps {
    onClose: () => void;
    // Accessible name for screen readers; the visible heading stays inside children
    title: string;
    // Classes for the white panel (width, height, layout)
    className?: string;
    // Block Escape and backdrop clicks, e.g. while a request is running
    preventClose?: boolean;
    children: React.ReactNode;
}

// Overlay + panel for every modal: closes on Escape and backdrop click,
// traps focus and locks page scroll while open.
export function ModalShell({ onClose, title, className = '', preventClose = false, children }: ModalShellProps) {
    return (
        <Dialog.Root open onOpenChange={open => { if (!open && !preventClose) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <Dialog.Content
                        aria-describedby={undefined}
                        className={`pointer-events-auto bg-white rounded-xl shadow-xl w-full focus:outline-none ${className}`}
                    >
                        <Dialog.Title className="sr-only">{title}</Dialog.Title>
                        {children}
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

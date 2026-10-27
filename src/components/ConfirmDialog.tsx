'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export interface ConfirmOptions {
    title: string;
    description?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    // Red confirm button for deletes and other hard-to-undo actions
    destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Replacement for window.confirm: `if (!(await confirm({ title: '...' }))) return;`
export function useConfirm(): ConfirmFn {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error('useConfirm must be used inside ConfirmProvider');
    }
    return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((opts) => {
        // A second confirm while one is open cancels the first
        resolveRef.current?.(false);
        setOptions(opts);
        return new Promise<boolean>(resolve => {
            resolveRef.current = resolve;
        });
    }, []);

    const close = (result: boolean) => {
        resolveRef.current?.(result);
        resolveRef.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <AlertDialog.Root open={options !== null} onOpenChange={open => { if (!open) close(false); }}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 focus:outline-none">
                        <AlertDialog.Title className="text-lg font-bold text-slate-900">
                            {options?.title}
                        </AlertDialog.Title>
                        {options?.description ? (
                            <AlertDialog.Description className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                                {options.description}
                            </AlertDialog.Description>
                        ) : (
                            <AlertDialog.Description className="sr-only">{options?.title}</AlertDialog.Description>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <AlertDialog.Cancel className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-sm">
                                {options?.cancelText ?? 'Cancel'}
                            </AlertDialog.Cancel>
                            <AlertDialog.Action
                                onClick={() => close(true)}
                                className={`px-4 py-2 text-white rounded-lg transition-colors text-sm ${
                                    options?.destructive
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {options?.confirmText ?? (options?.destructive ? 'Delete' : 'Confirm')}
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </ConfirmContext.Provider>
    );
}

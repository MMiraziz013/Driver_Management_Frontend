import React from 'react';
import { useAuth } from './AuthContext';
import { Lock } from 'lucide-react';

// ============================================================================
// Permission Constants (mirror of backend)
// ============================================================================

export const Permissions = {
    Drivers: {
        View: 'Permissions.Drivers.View',
        Manage: 'Permissions.Drivers.Manage',
        ManageAll: 'Permissions.Drivers.ManageAll',
    },
    DriverAssignments: {
        View: 'Permissions.DriverAssignments.View',
        Manage: 'Permissions.DriverAssignments.Manage',
        ManageAll: 'Permissions.DriverAssignments.ManageAll',
    },
    ReportPeriods: {
        View: 'Permissions.ReportPeriods.View',
        Manage: 'Permissions.ReportPeriods.Manage',
    },
    Trips: {
        View: 'Permissions.Trips.View',
        Manage: 'Permissions.Trips.Manage',
    },
    Vehicles: {
        View: 'Permissions.Vehicles.View',
        Manage: 'Permissions.Vehicles.Manage',
    },
    Users: {
        View: 'Permissions.Users.View',
        ManageAll: 'Permissions.Users.ManageAll',
    },
    ServiceTypes: {
        View: 'Permissions.ServiceTypes.View',
        Manage: 'Permissions.ServiceTypes.Manage',
    },
    Gas: {
        View: "Permissions.Gas.View",
        Manage: "Permissions.Gas.Manage",
    }
    
} as const;


// ============================================================================
// CanView - Renders children only if user can view
// ============================================================================

interface CanViewProps {
    permission?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function CanView({ permission, children, fallback = null }: CanViewProps) {
    const { isAuthenticated, hasPermission } = useAuth();

    if (!isAuthenticated) {
        return <>{fallback}</>;
    }

    // If no specific permission required, just check authentication
    if (!permission) {
        return <>{children}</>;
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}


// ============================================================================
// CanManage - Renders children only if user can modify/manage
// ============================================================================

interface CanManageProps {
    permission?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showDisabled?: boolean; // Show a disabled version instead of hiding
}

export function CanManage({ permission, children, fallback = null, showDisabled = false }: CanManageProps) {
    const { canManage, hasPermission } = useAuth();

    const hasAccess = permission ? hasPermission(permission) : canManage();

    if (hasAccess) {
        return <>{children}</>;
    }

    if (showDisabled) {
        // Wrap children in a disabled state
        return (
            <div className="opacity-50 cursor-not-allowed pointer-events-none" title="You don't have permission to perform this action">
                {children}
            </div>
        );
    }

    return <>{fallback}</>;
}


// ============================================================================
// PermissionButton - Button that checks permission before action
// ============================================================================

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    permission: string;
    children: React.ReactNode;
    onUnauthorized?: () => void;
}

export function PermissionButton({
                                     permission,
                                     children,
                                     onClick,
                                     onUnauthorized,
                                     className = '',
                                     ...props
                                 }: PermissionButtonProps) {
    const { hasPermission } = useAuth();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!hasPermission(permission)) {
            e.preventDefault();
            if (onUnauthorized) {
                onUnauthorized();
            } else {
                alert('You do not have permission to perform this action.');
            }
            return;
        }
        if (onClick) {
            onClick(e);
        }
    };

    const hasAccess = hasPermission(permission);

    return (
        <button
            {...props}
            onClick={handleClick}
            className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!hasAccess ? 'You do not have permission' : undefined}
        >
            {children}
        </button>
    );
}


// ============================================================================
// NoPermissionBanner - Shows when user has view-only access
// ============================================================================

export function NoPermissionBanner() {
    const { canManage, user } = useAuth();

    if (canManage()) {
        return null;
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-amber-700 text-sm">
                <Lock className="w-4 h-4" />
                <span>
                    You have view-only access. Contact an administrator for additional permissions.
                </span>
            </div>
        </div>
    );
}


// ============================================================================
// usePermission - Hook for checking permissions
// ============================================================================

export function usePermission(permission: string): boolean {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
}

export function useCanManage(): boolean {
    const { canManage } = useAuth();
    return canManage();
}
"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/lib/auth-middleware";

interface RoleBasedLayoutProps {
    children: React.ReactNode;
    requiredRole: UserRole;
    fallbackPath?: string;
}

export function RoleBasedLayout({
    children,
    requiredRole,
    fallbackPath = "/",
}: RoleBasedLayoutProps) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                // User is not authenticated
                router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
                return;
            }

            const userRole = (session.user as any)?.role || 'student';

            // Check if user has required role
            if (userRole !== 'admin' && userRole !== requiredRole) {
                // Redirect based on user role
                switch (userRole) {
                    case 'teacher':
                        router.push('/teacher');
                        break;
                    case 'student':
                        router.push('/exam');
                        break;
                    default:
                        router.push('/');
                }
                return;
            }
        }
    }, [session, isPending, requiredRole, router]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!session?.user) {
        return null; // Will redirect in useEffect
    }

    const userRole = (session.user as any)?.role || 'student';

    // Check if user has required role
    if (userRole !== 'admin' && userRole !== requiredRole) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}

// Higher-order component for pages
export function withRoleProtection<P extends object>(
    Component: React.ComponentType<P>,
    options: {
        requiredRole: UserRole;
        fallbackPath?: string;
    }
) {
    return function ProtectedComponent(props: P) {
        return (
            <RoleBasedLayout
                requiredRole={options.requiredRole}
                fallbackPath={options.fallbackPath}
            >
                <Component {...props} />
            </RoleBasedLayout>
        );
    };
}

// Specific layout components for different roles
export function TeacherLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleBasedLayout requiredRole="teacher" fallbackPath="/exam">
            {children}
        </RoleBasedLayout>
    );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleBasedLayout requiredRole="student" fallbackPath="/teacher">
            {children}
        </RoleBasedLayout>
    );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleBasedLayout requiredRole="admin" fallbackPath="/dashboard">
            {children}
        </RoleBasedLayout>
    );
}
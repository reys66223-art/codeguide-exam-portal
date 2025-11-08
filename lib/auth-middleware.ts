import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

// Define role-based access control
export type UserRole = 'teacher' | 'student' | 'admin';

export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string;
    school?: string;
    grade?: string;
}

// Middleware to check if user is authenticated
export async function isAuthenticated(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (session?.user) {
            return {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: (session.user.role as UserRole) || 'student',
                image: session.user.image,
                school: session.user.school,
                grade: session.user.grade,
            };
        }

        return null;
    } catch (error) {
        console.error("Authentication error:", error);
        return null;
    }
}

// Middleware to check if user has required role
export function hasRole(user: AuthenticatedUser | null, requiredRole: UserRole): boolean {
    if (!user) return false;

    // Admin has access to everything
    if (user.role === 'admin') return true;

    // Teachers can access teacher and student resources
    if (user.role === 'teacher' && requiredRole === 'student') return true;

    return user.role === requiredRole;
}

// Middleware to protect routes based on user role
export function protectRoute(requiredRole: UserRole) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
        const user = await isAuthenticated(request);

        if (!user) {
            // User is not authenticated, redirect to sign in
            const url = new URL('/sign-in', request.url);
            url.searchParams.set('redirect', request.url);
            return NextResponse.redirect(url);
        }

        if (!hasRole(user, requiredRole)) {
            // User doesn't have required role
            if (user.role === 'student') {
                return NextResponse.redirect(new URL('/exam', request.url));
            } else if (user.role === 'teacher') {
                return NextResponse.redirect(new URL('/teacher', request.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        // User is authenticated and has required role
        return null;
    };
}

// Server-side function to get current user
export async function getCurrentUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
    if (!request) {
        // For server components, we need to create a mock request
        // or use a different approach
        return null;
    }

    return await isAuthenticated(request);
}

// Function to check if user can access teacher routes
export function canAccessTeacherRoutes(user: AuthenticatedUser | null): boolean {
    return hasRole(user, 'teacher');
}

// Function to check if user can access student routes
export function canAccessStudentRoutes(user: AuthenticatedUser | null): boolean {
    return hasRole(user, 'student');
}

// Function to check if user can access admin routes
export function canAccessAdminRoutes(user: AuthenticatedUser | null): boolean {
    return hasRole(user, 'admin');
}

// HOC (Higher-Order Component) for protecting client components
export function withAuth<T extends object>(
    Component: React.ComponentType<T>,
    options?: {
        requiredRole?: UserRole;
        redirectTo?: string;
    }
) {
    return function AuthenticatedComponent(props: T) {
        // This will be used in client components with useSession hook
        return <Component {...props} />;
    };
}
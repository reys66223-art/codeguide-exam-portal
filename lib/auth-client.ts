import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;

// Enhanced session hook with role information
export function useAuthenticatedUser() {
    const { data: session, isPending, error } = useSession();

    return {
        user: session?.user ? {
            ...session.user,
            role: (session.user as any)?.role || 'student',
        } : null,
        session,
        isPending,
        error,
        isAuthenticated: !!session?.user,
        isTeacher: (session?.user as any)?.role === 'teacher',
        isStudent: (session?.user as any)?.role === 'student',
        isAdmin: (session?.user as any)?.role === 'admin',
    };
}

// Helper functions for role checking
export const userRoles = {
    isTeacher: (user: any) => user?.role === 'teacher',
    isStudent: (user: any) => user?.role === 'student',
    isAdmin: (user: any) => user?.role === 'admin',
    canAccessTeacherRoutes: (user: any) => userRoles.isAdmin(user) || userRoles.isTeacher(user),
    canAccessStudentRoutes: (user: any) => userRoles.isAdmin(user) || userRoles.isStudent(user),
};
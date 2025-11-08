import { useState, useEffect, useCallback } from 'react';

export interface StudentSession {
    sessionId: string;
    exam: {
        id: string;
        title: string;
        description?: string;
        duration: number;
        allowReview: boolean;
        showResultsImmediately: boolean;
        questionDisplayMode: 'one_by_one' | 'all_at_once';
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
    };
    participant: {
        id: string;
        name: string;
        nisnId: string;
    };
    session: {
        id: string;
        status: 'logged_in' | 'working' | 'completed' | 'disconnected' | 'timeout';
        loginTime: string;
        startTime?: string;
        currentQuestion: number;
        timeRemaining?: number;
    };
    isNewSession: boolean;
}

export interface StudentAuthData {
    examCode: string;
    studentName: string;
    nisnId: string;
    password: string;
    dateOfBirth?: string;
}

interface UseStudentAuthReturn {
    session: StudentSession | null;
    isLoading: boolean;
    error: string | null;
    login: (data: StudentAuthData) => Promise<boolean>;
    logout: () => void;
    refreshSession: () => Promise<void>;
}

// Storage keys
const STUDENT_SESSION_KEY = 'student_exam_session';

export function useStudentAuth(): UseStudentAuthReturn {
    const [session, setSession] = useState<StudentSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load session from localStorage on mount
    useEffect(() => {
        const storedSession = localStorage.getItem(STUDENT_SESSION_KEY);
        if (storedSession) {
            try {
                const parsedSession = JSON.parse(storedSession);
                setSession(parsedSession);
            } catch (error) {
                console.error('Error parsing stored session:', error);
                localStorage.removeItem(STUDENT_SESSION_KEY);
            }
        }
    }, []);

    // Save session to localStorage whenever it changes
    useEffect(() => {
        if (session) {
            localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(STUDENT_SESSION_KEY);
        }
    }, [session]);

    const login = useCallback(async (data: StudentAuthData): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/student-exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    ipAddress: await getClientIP(),
                    userAgent: navigator.userAgent,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            if (result.success) {
                setSession(result);
                return true;
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setSession(null);
        setError(null);
    }, []);

    const refreshSession = useCallback(async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            // You could implement a session refresh endpoint here
            // For now, we'll just validate the session still exists
            const response = await fetch(`/api/exam-session/${session.sessionId}/status`);
            if (response.ok) {
                const result = await response.json();
                if (result.session) {
                    setSession(prev => prev ? { ...prev, session: result.session } : null);
                }
            } else {
                // Session is invalid, logout
                logout();
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, logout]);

    return {
        session,
        isLoading,
        error,
        login,
        logout,
        refreshSession,
    };
}

// Helper function to get client IP (best effort)
async function getClientIP(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
}

// Hook for auto-refreshing session status
export function useStudentSessionAutoRefresh(refreshInterval: number = 30000) { // 30 seconds
    const { session, refreshSession } = useStudentAuth();

    useEffect(() => {
        if (!session || session.session.status === 'completed') {
            return;
        }

        const interval = setInterval(() => {
            refreshSession();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [session, refreshInterval, refreshInterval]);

    return session;
}

// Hook for managing exam timer
export function useExamTimer(initialTime: number, onTimeUp?: () => void) {
    const [timeRemaining, setTimeRemaining] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        onTimeUp?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, timeRemaining, onTimeUp]);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback((newTime?: number) => {
        setTimeRemaining(newTime ?? initialTime);
        setIsRunning(false);
    }, [initialTime]);

    const addTime = useCallback((seconds: number) => {
        setTimeRemaining((prev) => prev + seconds);
    }, []);

    const formatTime = useCallback((seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    }, []);

    return {
        timeRemaining,
        isRunning,
        start,
        pause,
        reset,
        addTime,
        formatTime,
        formattedTime: formatTime(timeRemaining),
    };
}
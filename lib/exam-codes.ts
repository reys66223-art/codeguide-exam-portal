import { generateId } from "better-auth";

/**
 * Generate a unique exam code that students can use to access exams
 * Format: XXXX-XXXX (4 characters, dash, 4 characters)
 * Uses uppercase letters and numbers, excluding ambiguous characters like 0 and O
 */
export function generateExamCode(): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Excludes 0, O to avoid confusion
    let code = '';

    // Generate 4 characters
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    code += '-';

    // Generate another 4 characters
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

/**
 * Generate a participant password for students
 * Simple 6-digit numeric password
 */
export function generateParticipantPassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate exam code format
 */
export function isValidExamCode(code: string): boolean {
    const examCodeRegex = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    return examCodeRegex.test(code.toUpperCase());
}

/**
 * Format exam code for display (uppercase)
 */
export function formatExamCode(code: string): string {
    return code.toUpperCase();
}
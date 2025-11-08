import { NextRequest, NextResponse } from "next/server";
import { getExamSession } from "@/lib/database-utils";

// Simple endpoint to check if session is still valid
export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        const session = await getExamSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Check if session has timed out
        let isExpired = false;
        if (session.startTime && !session.endTime && session.timeRemaining) {
            const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
            isExpired = elapsed > session.timeRemaining;
        }

        return NextResponse.json({
            session: {
                id: session.id,
                status: session.status,
                isSubmitted: session.isSubmitted,
                lastActivity: session.lastActivity,
                isExpired,
            },
        });

    } catch (error) {
        console.error("Error checking session status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
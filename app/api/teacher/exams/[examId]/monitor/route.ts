import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-middleware";
import { getActiveExamSessions, getRecentActivityLogs, getExamStatistics } from "@/lib/database-utils";
import { getExamByCode } from "@/lib/database-utils";

// Get real-time monitoring data for an exam
export async function GET(
    request: NextRequest,
    { params }: { params: { examId: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const { examId } = params;

        // Get active sessions
        const activeSessions = await getActiveExamSessions(examId);

        // Get recent activity
        const recentActivity = await getRecentActivityLogs(examId, 50);

        // Get exam statistics
        const stats = await getExamStatistics(examId);

        // Process sessions for monitoring
        const processedSessions = activeSessions.map(session => ({
            id: session.id,
            studentName: session.studentName,
            status: session.status,
            loginTime: session.loginTime,
            startTime: session.startTime,
            lastActivity: session.lastActivity,
            currentQuestion: session.currentQuestion,
            timeRemaining: session.timeRemaining,
            ipAddress: session.ipAddress,
            // Calculate session duration
            sessionDuration: session.startTime
                ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)
                : 0,
            // Calculate inactivity time
            inactiveTime: Math.floor((Date.now() - new Date(session.lastActivity).getTime()) / 1000),
        }));

        // Process activity logs
        const processedActivity = recentActivity.map(log => ({
            id: log.id,
            activity: log.activity,
            questionNumber: log.questionNumber,
            timestamp: log.timestamp,
            studentName: log.session?.studentName || 'Unknown',
            details: log.details ? JSON.parse(log.details as string) : null,
        }));

        // Calculate real-time metrics
        const now = new Date();
        const metrics = {
            totalActive: processedSessions.length,
            currentlyWorking: processedSessions.filter(s => s.status === 'working').length,
            loggedIn: processedSessions.filter(s => s.status === 'logged_in').length,
            completed: stats?.completedSessions || 0,
            averageSessionDuration: processedSessions.length > 0
                ? Math.round(processedSessions.reduce((sum, s) => sum + s.sessionDuration, 0) / processedSessions.length)
                : 0,
            inactiveStudents: processedSessions.filter(s => s.inactiveTime > 300).length, // Inactive for 5+ minutes
            averageProgress: processedSessions.length > 0
                ? Math.round(processedSessions.reduce((sum, s) => sum + (s.currentQuestion || 1), 0) / processedSessions.length)
                : 0,
        };

        return NextResponse.json({
            success: true,
            data: {
                sessions: processedSessions,
                activity: processedActivity,
                statistics: stats,
                metrics,
                lastUpdated: now.toISOString(),
            },
        });

    } catch (error) {
        console.error("Error fetching monitoring data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
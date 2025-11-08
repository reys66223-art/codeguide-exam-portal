"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Activity,
    Clock,
    AlertTriangle,
    CheckCircle,
    Play,
    Pause,
    Eye,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MonitoringData {
    sessions: Array<{
        id: string;
        studentName: string;
        status: 'logged_in' | 'working' | 'completed' | 'disconnected' | 'timeout';
        loginTime: string;
        startTime?: string;
        lastActivity: string;
        currentQuestion: number;
        timeRemaining?: number;
        sessionDuration: number;
        inactiveTime: number;
        ipAddress?: string;
    }>;
    activity: Array<{
        id: string;
        activity: string;
        questionNumber?: number;
        timestamp: string;
        studentName: string;
        details?: any;
    }>;
    statistics: {
        totalParticipants?: number;
        activeSessions?: number;
        completedSessions?: number;
        averageScore?: number;
    };
    metrics: {
        totalActive: number;
        currentlyWorking: number;
        loggedIn: number;
        completed: number;
        averageSessionDuration: number;
        inactiveStudents: number;
        averageProgress: number;
    };
    lastUpdated: string;
}

interface RealTimeMonitorProps {
    examId: string;
}

export function RealTimeMonitor({ examId }: RealTimeMonitorProps) {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch monitoring data
    const fetchData = async () => {
        try {
            setIsRefreshing(true);
            const response = await fetch(`/api/teacher/exams/${examId}/monitor`);

            if (!response.ok) {
                throw new Error('Failed to fetch monitoring data');
            }

            const result = await response.json();
            setData(result.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching monitoring data:', error);
            setError('Failed to load monitoring data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Auto-refresh every 10 seconds
    useEffect(() => {
        fetchData();

        if (autoRefresh) {
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [examId, autoRefresh]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        return `${minutes}m ${secs}s`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'working':
                return <Play className="h-4 w-4 text-green-500" />;
            case 'logged_in':
                return <Pause className="h-4 w-4 text-blue-500" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'disconnected':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'timeout':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'working':
                return 'bg-green-100 text-green-800';
            case 'logged_in':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'disconnected':
                return 'bg-orange-100 text-orange-800';
            case 'timeout':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getActivityIcon = (activity: string) => {
        switch (activity) {
            case 'login':
                return <Users className="h-4 w-4 text-blue-500" />;
            case 'start_exam':
                return <Play className="h-4 w-4 text-green-500" />;
            case 'view_question':
                return <Eye className="h-4 w-4 text-purple-500" />;
            case 'answer_question':
                return <Activity className="h-4 w-4 text-orange-500" />;
            case 'submit_exam':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse">
                            <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>No monitoring data available</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">Real-time Monitoring</h3>
                    <Badge variant="outline">
                        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        Auto-refresh: {autoRefresh ? 'On' : 'Off'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Students</p>
                                <p className="text-2xl font-bold text-gray-900">{data.metrics.totalActive}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Play className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Working</p>
                                <p className="text-2xl font-bold text-gray-900">{data.metrics.currentlyWorking}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Inactive</p>
                                <p className="text-2xl font-bold text-gray-900">{data.metrics.inactiveStudents}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatDuration(data.metrics.averageSessionDuration)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Sessions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>
                            Real-time status of all student sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.sessions.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No active sessions</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {data.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>
                                                    {session.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{session.studentName}</p>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(session.status)}
                                                    <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                                                        {session.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-gray-600">
                                            <p>Q{session.currentQuestion}</p>
                                            <p>{formatDuration(session.sessionDuration)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest student actions and events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.activity.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {data.activity.slice(0, 20).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-2">
                                        {getActivityIcon(activity.activity)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {activity.studentName} - {activity.activity.replace('_', ' ')}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                {activity.questionNumber && (
                                                    <span>Question {activity.questionNumber}</span>
                                                )}
                                                <span>•</span>
                                                <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
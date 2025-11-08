"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherLayout } from "@/components/role-based-layout";
import { RealTimeMonitor } from "@/components/real-time-monitor";
import { useAuthenticatedUser } from "@/lib/auth-client";
import {
    ArrowLeft,
    Monitor,
    Users,
    FileText,
    BarChart3,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface ExamDetails {
    id: string;
    title: string;
    description?: string;
    duration: number;
    code: string;
    isActive: boolean;
    createdAt: string;
}

export default function ExamMonitorPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const { user } = useAuthenticatedUser();
    const [exam, setExam] = useState<ExamDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.examId) {
            fetchExamDetails();
        }
    }, [params.examId]);

    const fetchExamDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/teacher/exams/${params.examId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch exam details');
            }

            // Since we don't have a getExamById endpoint yet, we'll use placeholder data
            // In a real implementation, you would fetch the exam details
            setExam({
                id: params.examId,
                title: "Sample Exam",
                description: "Sample exam description",
                duration: 120,
                code: "SAMPLE-1234",
                isActive: true,
                createdAt: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Error fetching exam details:', error);
            setError('Failed to load exam details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <TeacherLayout>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                            <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </TeacherLayout>
        );
    }

    if (error || !exam) {
        return (
            <TeacherLayout>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-12">
                            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Error Loading Exam
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {error || "Unable to load exam details"}
                            </p>
                            <Link href="/teacher">
                                <Button>Back to Dashboard</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/teacher">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Monitor className="h-6 w-6" />
                                    Exam Monitor
                                </h1>
                                <p className="text-gray-600">
                                    {exam.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={exam.isActive ? "default" : "secondary"}>
                                {exam.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                                Code: {exam.code}
                            </Badge>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                                        <p className="text-2xl font-bold text-gray-900">--</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-2xl font-bold text-gray-900">--</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <FileText className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Questions</p>
                                        <p className="text-2xl font-bold text-gray-900">--</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <BarChart3 className="h-8 w-8 text-orange-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Avg Score</p>
                                        <p className="text-2xl font-bold text-gray-900">--%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="monitor" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="monitor">Real-time Monitor</TabsTrigger>
                            <TabsTrigger value="results">Results</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="monitor" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Live Monitoring</CardTitle>
                                    <CardDescription>
                                        Real-time monitoring of student activity and progress
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RealTimeMonitor examId={params.examId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="results" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Exam Results</CardTitle>
                                    <CardDescription>
                                        View and manage exam results and submissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Results coming soon
                                        </h3>
                                        <p className="text-gray-600">
                                            Detailed exam results and grading interface will be available here
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Analytics</CardTitle>
                                    <CardDescription>
                                        Detailed analytics and insights on exam performance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Analytics coming soon
                                        </h3>
                                        <p className="text-gray-600">
                                            Comprehensive analytics and performance metrics will be available here
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Logs</CardTitle>
                                    <CardDescription>
                                        Complete activity history for this exam
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Activity logs coming soon
                                        </h3>
                                        <p className="text-gray-600">
                                            Detailed activity logs and audit trail will be available here
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </TeacherLayout>
    );
}
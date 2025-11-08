"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeacherLayout } from "@/components/role-based-layout";
import { useAuthenticatedUser } from "@/lib/auth-client";
import {
    Plus,
    BookOpen,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Eye,
    Edit,
    Trash2,
    Play,
    Settings,
} from "lucide-react";

interface Exam {
    id: string;
    title: string;
    description?: string;
    duration: number;
    code: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    questionCount?: number;
    participantCount?: number;
}

interface DashboardStats {
    totalExams: number;
    activeExams: number;
    totalQuestions: number;
    totalParticipants: number;
}

export default function TeacherDashboard() {
    const router = useRouter();
    const { user, isPending } = useAuthenticatedUser();
    const [exams, setExams] = useState<Exam[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalExams: 0,
        activeExams: 0,
        totalQuestions: 0,
        totalParticipants: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchExams();
        }
    }, [user]);

    const fetchExams = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/teacher/exams');

            if (!response.ok) {
                throw new Error('Failed to fetch exams');
            }

            const data = await response.json();
            setExams(data.exams || []);

            // Calculate stats
            const totalExams = data.exams?.length || 0;
            const activeExams = data.exams?.filter((exam: Exam) => exam.isActive).length || 0;
            const totalQuestions = data.exams?.reduce((sum: number, exam: Exam) => sum + (exam.questionCount || 0), 0) || 0;
            const totalParticipants = data.exams?.reduce((sum: number, exam: Exam) => sum + (exam.participantCount || 0), 0) || 0;

            setStats({
                totalExams,
                activeExams,
                totalQuestions,
                totalParticipants,
            });

        } catch (error) {
            console.error('Error fetching exams:', error);
            setError('Failed to load exams. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateExam = () => {
        router.push('/teacher/exams/create');
    };

    const handleEditExam = (examId: string) => {
        router.push(`/teacher/exams/${examId}/edit`);
    };

    const handleManageQuestions = (examId: string) => {
        router.push(`/teacher/exams/${examId}/questions`);
    };

    const handleManageParticipants = (examId: string) => {
        router.push(`/teacher/exams/${examId}/participants`);
    };

    const handleMonitorExam = (examId: string) => {
        router.push(`/teacher/exams/${examId}/monitor`);
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins} minutes`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (isPending || isLoading) {
        return (
            <TeacherLayout>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                            <div className="h-96 bg-gray-200 rounded"></div>
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
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Teacher Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Welcome back, {user?.name}! Manage your exams and monitor student progress.
                            </p>
                        </div>
                        <Button onClick={handleCreateExam} size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Exam
                        </Button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <BookOpen className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Exams</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Play className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Active Exams</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.activeExams}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <CheckCircle className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Questions</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-orange-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Participants</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="exams" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="exams">My Exams</TabsTrigger>
                            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="exams" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Exams</CardTitle>
                                    <CardDescription>
                                        Manage your exams, questions, and participants
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {exams.length === 0 ? (
                                        <div className="text-center py-12">
                                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                No exams yet
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                Create your first exam to get started
                                            </p>
                                            <Button onClick={handleCreateExam}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Exam
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {exams.map((exam) => (
                                                <div
                                                    key={exam.id}
                                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    {exam.title}
                                                                </h3>
                                                                <Badge variant={exam.isActive ? "default" : "secondary"}>
                                                                    {exam.isActive ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </div>

                                                            <p className="text-gray-600 mb-3">
                                                                {exam.description || "No description"}
                                                            </p>

                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    {formatDuration(exam.duration)}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <BookOpen className="h-4 w-4" />
                                                                    {exam.questionCount || 0} questions
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4" />
                                                                    {exam.participantCount || 0} participants
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    Code: <code className="bg-gray-100 px-1 rounded">{exam.code}</code>
                                                                </div>
                                                                <div>
                                                                    Created: {formatDate(exam.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 ml-4">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleManageQuestions(exam.id)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Questions
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleManageParticipants(exam.id)}
                                                            >
                                                                <Users className="h-4 w-4 mr-1" />
                                                                Participants
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleMonitorExam(exam.id)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Monitor
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditExam(exam.id)}
                                                            >
                                                                <Settings className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="recent" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>
                                        Monitor recent exam activities and student participation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Activity tracking coming soon
                                        </h3>
                                        <p className="text-gray-600">
                                            View detailed activity logs and student engagement metrics
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Exam Analytics</CardTitle>
                                    <CardDescription>
                                        Performance insights and statistics
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Analytics coming soon
                                        </h3>
                                        <p className="text-gray-600">
                                            Detailed analytics and performance reports will be available here
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
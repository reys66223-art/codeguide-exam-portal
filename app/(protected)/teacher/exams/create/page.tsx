"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { TeacherLayout } from "@/components/role-based-layout";
import { Loader2, AlertCircle, ArrowLeft, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

const CreateExamSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    duration: z.number().int().min(1, "Duration must be at least 1 minute").max(480, "Duration must be less than 8 hours"),
    settings: z.object({
        allowReview: z.boolean().default(true),
        showResultsImmediately: z.boolean().default(true),
        questionDisplayMode: z.enum(['one_by_one', 'all_at_once']).default('one_by_one'),
        shuffleQuestions: z.boolean().default(false),
        shuffleOptions: z.boolean().default(false),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }).optional(),
});

type CreateExamFormData = z.infer<typeof CreateExamSchema>;

export default function CreateExamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdExam, setCreatedExam] = useState<any>(null);

    const form = useForm<CreateExamFormData>({
        resolver: zodResolver(CreateExamSchema),
        defaultValues: {
            title: "",
            description: "",
            duration: 60,
            settings: {
                allowReview: true,
                showResultsImmediately: true,
                questionDisplayMode: "one_by_one",
                shuffleQuestions: false,
                shuffleOptions: false,
            },
        },
    });

    const watchedSettings = form.watch("settings");

    const onSubmit = async (data: CreateExamFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/teacher/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create exam');
            }

            setCreatedExam(result.exam);
        } catch (error) {
            console.error('Error creating exam:', error);
            setError(error instanceof Error ? error.message : 'Failed to create exam');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddQuestions = () => {
        if (createdExam) {
            router.push(`/teacher/exams/${createdExam.id}/questions`);
        }
    };

    const handleAddParticipants = () => {
        if (createdExam) {
            router.push(`/teacher/exams/${createdExam.id}/participants`);
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins} minutes`;
    };

    if (createdExam) {
        return (
            <TeacherLayout>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-3xl mx-auto">
                        <Card>
                            <CardHeader className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <BookOpen className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold text-green-900">
                                    Exam Created Successfully!
                                </CardTitle>
                                <CardDescription>
                                    Your exam has been created. Share the exam code with your students.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Exam Details */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <h3 className="font-semibold text-green-900 mb-4">Exam Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium text-green-700">Title</Label>
                                            <p className="text-green-900">{createdExam.title}</p>
                                        </div>
                                        {createdExam.description && (
                                            <div>
                                                <Label className="text-sm font-medium text-green-700">Description</Label>
                                                <p className="text-green-900">{createdExam.description}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-green-700">Duration</Label>
                                                <p className="text-green-900">{formatDuration(createdExam.duration)}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-green-700">Exam Code</Label>
                                                <p className="text-lg font-mono text-green-900 bg-green-100 px-3 py-1 rounded inline-block">
                                                    {createdExam.code}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleAddQuestions}
                                            className="w-full"
                                            size="lg"
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Add Questions
                                        </Button>
                                        <Button
                                            onClick={handleAddParticipants}
                                            variant="outline"
                                            className="w-full"
                                            size="lg"
                                        >
                                            Add Participants
                                        </Button>
                                        <Link href="/teacher">
                                            <Button variant="ghost" className="w-full">
                                                Back to Dashboard
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Share Instructions:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Share the exam code: <code className="bg-blue-100 px-1 rounded">{createdExam.code}</code></li>
                                        <li>• Students can access the exam at /exam</li>
                                        <li>• Make sure to add questions before activating the exam</li>
                                        <li>• Register participants or allow self-registration</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/teacher">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
                            <p className="text-gray-600">Set up your exam details and preferences</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Exam Information</CardTitle>
                            <CardDescription>
                                Provide basic information about your exam
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Exam Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., Mathematics Final Exam"
                                            {...form.register("title")}
                                        />
                                        {form.formState.errors.title && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (optional)</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Provide a brief description of the exam content and expectations"
                                            rows={3}
                                            {...form.register("description")}
                                        />
                                        {form.formState.errors.description && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.description.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (minutes) *</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="duration"
                                                type="number"
                                                min="1"
                                                max="480"
                                                {...form.register("duration", { valueAsNumber: true })}
                                                className="w-32"
                                            />
                                            <span className="text-sm text-gray-500">
                                                {watchedSettings?.duration ? formatDuration(watchedSettings.duration) : "60 minutes"}
                                            </span>
                                        </div>
                                        {form.formState.errors.duration && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.duration.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Exam Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Settings</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="allowReview">Allow Review</Label>
                                                    <p className="text-sm text-gray-500">
                                                        Students can review marked questions before submitting
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="allowReview"
                                                    checked={watchedSettings?.allowReview}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue("settings.allowReview", checked)
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="showResults">Show Results Immediately</Label>
                                                    <p className="text-sm text-gray-500">
                                                        Display scores right after submission
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="showResults"
                                                    checked={watchedSettings?.showResultsImmediately}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue("settings.showResultsImmediately", checked)
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                                                    <p className="text-sm text-gray-500">
                                                        Randomize question order for each student
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="shuffleQuestions"
                                                    checked={watchedSettings?.shuffleQuestions}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue("settings.shuffleQuestions", checked)
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                                                    <p className="text-sm text-gray-500">
                                                        Randomize answer choices for multiple choice
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="shuffleOptions"
                                                    checked={watchedSettings?.shuffleOptions}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue("settings.shuffleOptions", checked)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="questionDisplayMode">Question Display Mode</Label>
                                        <Select
                                            value={watchedSettings?.questionDisplayMode}
                                            onValueChange={(value: 'one_by_one' | 'all_at_once') =>
                                                form.setValue("settings.questionDisplayMode", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select display mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="one_by_one">
                                                    One question at a time
                                                </SelectItem>
                                                <SelectItem value="all_at_once">
                                                    All questions at once
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500">
                                            {watchedSettings?.questionDisplayMode === 'one_by_one'
                                                ? "Students see one question at a time and can navigate between them"
                                                : "Students see all questions on a single page"}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Scheduling (Optional) */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Scheduling (Optional)
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Leave empty to make the exam available immediately
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="startDate">Start Date</Label>
                                            <Input
                                                id="startDate"
                                                type="datetime-local"
                                                {...form.register("settings.startDate")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="endDate">End Date</Label>
                                            <Input
                                                id="endDate"
                                                type="datetime-local"
                                                {...form.register("settings.endDate")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3">
                                    <Link href="/teacher">
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Exam...
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="mr-2 h-4 w-4" />
                                                Create Exam
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TeacherLayout>
    );
}
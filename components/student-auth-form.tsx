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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStudentAuth } from "@/lib/use-student-auth";
import { Loader2, AlertCircle, BookOpen, Clock, UserCheck } from "lucide-react";

const StudentAuthSchema = z.object({
    examCode: z.string()
        .min(9, "Exam code must be 9 characters (XXXX-XXXX)")
        .max(9, "Exam code must be 9 characters (XXXX-XXXX)")
        .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i, "Exam code must be in XXXX-XXXX format"),
    studentName: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
    nisnId: z.string()
        .min(4, "ID/NISN must be at least 4 characters")
        .max(20, "ID/NISN must be less than 20 characters"),
    password: z.string()
        .min(4, "Password must be at least 4 characters")
        .max(20, "Password must be less than 20 characters"),
    dateOfBirth: z.string()
        .optional()
        .refine(
            (date) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date),
            { message: "Date must be in YYYY-MM-DD format" }
        ),
});

type StudentAuthFormData = z.infer<typeof StudentAuthSchema>;

export function StudentAuthForm() {
    const router = useRouter();
    const { login, isLoading, error } = useStudentAuth();
    const [showDateOfBirth, setShowDateOfBirth] = useState(false);

    const form = useForm<StudentAuthFormData>({
        resolver: zodResolver(StudentAuthSchema),
        defaultValues: {
            examCode: "",
            studentName: "",
            nisnId: "",
            password: "",
            dateOfBirth: "",
        },
    });

    const watchedExamCode = form.watch("examCode");
    const watchedNisnId = form.watch("nisnId");

    // Auto-format exam code
    const handleExamCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // Add dash after 4 characters
        if (value.length > 4) {
            value = value.slice(0, 4) + "-" + value.slice(4, 8);
        }

        form.setValue("examCode", value);
    };

    // Check if we should show date of birth field
    const handleNisnIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("nisnId", e.target.value);

        // Show date of birth if user hasn't entered this NISN before
        // In a real app, you might check against a database
        setShowDateOfBirth(true);
    };

    const onSubmit = async (data: StudentAuthFormData) => {
        const success = await login(data);
        if (success) {
            router.push("/exam");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Student Exam Login
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Enter your exam code and credentials to access your exam
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Exam Code Input */}
                        <div className="space-y-2">
                            <Label htmlFor="examCode" className="text-sm font-medium text-gray-700">
                                Exam Code
                            </Label>
                            <Input
                                id="examCode"
                                placeholder="XXXX-XXXX"
                                value={watchedExamCode}
                                onChange={handleExamCodeChange}
                                className="text-center text-lg font-mono tracking-wider"
                                maxLength={9}
                            />
                            {form.formState.errors.examCode && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.examCode.message}
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Student Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>

                            <div className="space-y-2">
                                <Label htmlFor="studentName" className="text-sm font-medium text-gray-700">
                                    Full Name
                                </Label>
                                <Input
                                    id="studentName"
                                    placeholder="Enter your full name"
                                    {...form.register("studentName")}
                                    className="text-lg"
                                />
                                {form.formState.errors.studentName && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.studentName.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nisnId" className="text-sm font-medium text-gray-700">
                                        NISN / Student ID
                                    </Label>
                                    <Input
                                        id="nisnId"
                                        placeholder="Enter your ID"
                                        {...form.register("nisnId")}
                                        onChange={handleNisnIdChange}
                                    />
                                    {form.formState.errors.nisnId && (
                                        <p className="text-sm text-red-600">
                                            {form.formState.errors.nisnId.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter password"
                                        {...form.register("password")}
                                    />
                                    {form.formState.errors.password && (
                                        <p className="text-sm text-red-600">
                                            {form.formState.errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date of Birth - shown for new students */}
                            {showDateOfBirth && (
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                                        Date of Birth <span className="text-gray-500">(for new registrations)</span>
                                    </Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        placeholder="YYYY-MM-DD"
                                        {...form.register("dateOfBirth")}
                                    />
                                    {form.formState.errors.dateOfBirth && (
                                        <p className="text-sm text-red-600">
                                            {form.formState.errors.dateOfBirth.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Start Exam
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Exam Instructions:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Enter the exam code provided by your teacher</li>
                            <li>• Use your registered name and student ID</li>
                            <li>• If you're a new student, provide your date of birth</li>
                            <li>• Make sure you have a stable internet connection</li>
                            <li>• The exam timer will start when you begin</li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Timed Exams
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Auto-Save
                        </Badge>
                        <Badge variant="secondary">
                            Review Mode
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
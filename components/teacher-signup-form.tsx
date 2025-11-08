"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, GraduationCap, Mail, Lock, Building } from "lucide-react";

const TeacherSignupSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
    email: z.string()
        .email("Please enter a valid email address")
        .max(100, "Email must be less than 100 characters"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirmPassword: z.string(),
    school: z.string()
        .min(2, "School name must be at least 2 characters")
        .max(100, "School name must be less than 100 characters"),
    phoneNumber: z.string()
        .optional()
        .refine(
            (phone) => !phone || /^[\d\s\-\+\(\)]+$/.test(phone),
            { message: "Please enter a valid phone number" }
        ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type TeacherSignupFormData = z.infer<typeof TeacherSignupSchema>;

export function TeacherSignupForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<TeacherSignupFormData>({
        resolver: zodResolver(TeacherSignupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            school: "",
            phoneNumber: "",
        },
    });

    const onSubmit = async (data: TeacherSignupFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
                // Additional fields will be handled by the auth hook
            });

            // Redirect to email verification or dashboard
            router.push('/sign-in?message=Registration successful. Please sign in.');
        } catch (error: any) {
            console.error("Signup error:", error);
            setError(error.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <GraduationCap className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Teacher Registration
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Create your teacher account to start creating exams
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your full name"
                                    {...form.register("name")}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@school.edu"
                                    {...form.register("email")}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Password */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    {...form.register("password")}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter your password"
                                    {...form.register("confirmPassword")}
                                />
                                {form.formState.errors.confirmPassword && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* School Information */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="school" className="text-sm font-medium text-gray-700">
                                    School Name
                                </Label>
                                <Input
                                    id="school"
                                    placeholder="Enter your school name"
                                    {...form.register("school")}
                                />
                                {form.formState.errors.school && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.school.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                                    Phone Number <span className="text-gray-500">(optional)</span>
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    placeholder="+1 (555) 123-4567"
                                    {...form.register("phoneNumber")}
                                />
                                {form.formState.errors.phoneNumber && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.phoneNumber.message}
                                    </p>
                                )}
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
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Create Teacher Account
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Features */}
                    <div className="mt-6 space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-3">As a teacher, you'll be able to:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    Create Exams
                                </Badge>
                                <Badge variant="secondary">
                                    Manage Questions
                                </Badge>
                                <Badge variant="secondary">
                                    Monitor Students
                                </Badge>
                                <Badge variant="secondary">
                                    AI Grading
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <a
                                href="/sign-in"
                                className="font-medium text-purple-600 hover:text-purple-500"
                            >
                                Sign in here
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
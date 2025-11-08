"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useStudentAuth, useExamTimer } from "@/lib/use-student-auth";
import { BookOpen, Clock, AlertCircle, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ExamPage() {
    const router = useRouter();
    const { session, isLoading, error, logout } = useStudentAuth();

    // Timer hook
    const timer = useExamTimer(
        session?.exam.duration * 60 || 3600, // Convert minutes to seconds
        () => {
            // Auto-submit when time is up
            handleSubmitExam();
        }
    );

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);

    useEffect(() => {
        if (session && !timer.isRunning) {
            timer.start();
            setQuestionStartTime(Date.now());
        }
    }, [session, timer]);

    useEffect(() => {
        if (session) {
            fetchQuestions();
        }
    }, [session]);

    const fetchQuestions = async () => {
        if (!session) return;

        try {
            const response = await fetch(`/api/exam/questions/${session.sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions || []);
                setCurrentQuestionIndex(data.session?.currentQuestion - 1 || 0);
            } else {
                console.error('Failed to fetch questions');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const saveAnswer = async (questionId: string, answerText: string) => {
        if (!session) return;

        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

        try {
            await fetch(`/api/exam/answers/${session.sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId,
                    answerText,
                    isMarkedForReview: markedForReview[questionId] || false,
                    timeSpent,
                }),
            });

            setQuestionStartTime(Date.now());
        } catch (error) {
            console.error('Error saving answer:', error);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
        saveAnswer(questionId, answer);
    };

    const handleMarkForReview = (questionId: string) => {
        const newMarked = !markedForReview[questionId];
        setMarkedForReview(prev => ({ ...prev, [questionId]: newMarked }));

        // Save the marked status
        saveAnswer(questionId, answers[questionId] || '');
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setQuestionStartTime(Date.now());
        }
    };

    const handleQuestionSelect = (index: number) => {
        setCurrentQuestionIndex(index);
        setQuestionStartTime(Date.now());
    };

    const handleSubmitExam = async () => {
        if (!session || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Save any unsaved answer
            const currentQuestion = questions[currentQuestionIndex];
            if (currentQuestion) {
                await saveAnswer(currentQuestion.id, answers[currentQuestion.id] || '');
            }

            // Submit the exam
            const response = await fetch(`/api/exam/submit/${session.sessionId}`, {
                method: 'POST',
            });

            if (response.ok) {
                const result = await response.json();
                setSubmitResult(result);
                timer.pause();
            } else {
                console.error('Failed to submit exam');
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAnswerStatus = (questionId: string) => {
        const hasAnswer = answers[questionId] && answers[questionId].trim() !== '';
        const isMarked = markedForReview[questionId];

        if (isMarked) return 'marked';
        if (hasAnswer) return 'answered';
        return 'unanswered';
    };

    const getAnswerStatusColor = (status: string) => {
        switch (status) {
            case 'answered': return 'bg-green-100 text-green-800 border-green-200';
            case 'marked': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const answeredCount = Object.values(answers).filter(answer => answer && answer.trim() !== '').length;
    const markedCount = Object.values(markedForReview).filter(marked => marked).length;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading exam...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <CardTitle className="text-red-900">Session Error</CardTitle>
                        <CardDescription>
                            {error || "Unable to load exam session"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button onClick={logout} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Results display
    if (submitResult) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-900">
                                Exam Submitted Successfully!
                            </CardTitle>
                            <CardDescription>
                                Thank you for completing the exam
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Results Summary */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Your Results</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {submitResult.results.percentage}%
                                        </p>
                                        <p className="text-sm text-gray-600">Score</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {submitResult.results.totalScore}/{submitResult.results.maxScore}
                                        </p>
                                        <p className="text-sm text-gray-600">Points</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-600">
                                            {submitResult.results.totalAnswers}/{submitResult.results.totalQuestions}
                                        </p>
                                        <p className="text-sm text-gray-600">Questions Answered</p>
                                    </div>
                                </div>
                            </div>

                            {/* Time Spent */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <span className="text-blue-900 font-medium">Time Spent</span>
                                    </div>
                                    <span className="text-blue-900">
                                        {timer.formattedTime}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-center">
                                <Button onClick={logout} size="lg">
                                    Exit Exam
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Exit
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {session.exam.title}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </p>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                timer.timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                                <Clock className="h-4 w-4" />
                                <span className="font-mono font-medium">
                                    {timer.formattedTime}
                                </span>
                            </div>
                            <Badge variant="outline">
                                {answeredCount}/{questions.length} answered
                            </Badge>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Navigation */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Question Navigation</CardTitle>
                                <CardDescription>
                                    Click on a number to jump to that question
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((question, index) => {
                                        const status = getAnswerStatus(question.id);
                                        const isCurrent = index === currentQuestionIndex;

                                        return (
                                            <button
                                                key={question.id}
                                                onClick={() => handleQuestionSelect(index)}
                                                className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors ${
                                                    isCurrent
                                                        ? 'border-blue-500 bg-blue-500 text-white'
                                                        : getAnswerStatusColor(status)
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
                                        <span>Marked for Review</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                                        <span>Not Answered</span>
                                    </div>
                                </div>

                                {markedCount > 0 && (
                                    <Alert className="mt-4">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            {markedCount} question{markedCount > 1 ? 's' : ''} marked for review
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Question Area */}
                    <div className="lg:col-span-3">
                        {currentQuestion && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline">
                                                    {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Essay'}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xl">
                                                {currentQuestion.content}
                                            </CardTitle>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkForReview(currentQuestion.id)}
                                            className={markedForReview[currentQuestion.id] ? 'bg-yellow-50 border-yellow-200' : ''}
                                        >
                                            {markedForReview[currentQuestion.id] ? '✓ Marked' : 'Mark for Review'}
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Multiple Choice Question */}
                                    {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                                        <div className="space-y-3">
                                            {currentQuestion.options.map((option: any) => (
                                                <label
                                                    key={option.id}
                                                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                                        answers[currentQuestion.id] === option.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion.id}`}
                                                        value={option.id}
                                                        checked={answers[currentQuestion.id] === option.id}
                                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                        className="mr-3"
                                                    />
                                                    <span className="text-base">{option.text}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Essay Question */}
                                    {currentQuestion.type === 'essay' && (
                                        <div className="space-y-2">
                                            <label htmlFor={`essay-${currentQuestion.id}`} className="text-sm font-medium text-gray-700">
                                                Your Answer
                                            </label>
                                            <textarea
                                                id={`essay-${currentQuestion.id}`}
                                                rows={8}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Type your answer here..."
                                                value={answers[currentQuestion.id] || ''}
                                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Navigation Buttons */}
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={handlePreviousQuestion}
                                            disabled={currentQuestionIndex === 0}
                                        >
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            {currentQuestionIndex < questions.length - 1 ? (
                                                <Button onClick={handleNextQuestion}>
                                                    Next
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleSubmitExam}
                                                    disabled={isSubmitting}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        'Submit Exam'
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
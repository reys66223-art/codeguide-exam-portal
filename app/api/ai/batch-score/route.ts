import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { batchScoreEssays } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth-middleware";

const BatchScoreSchema = z.object({
    essays: z.array(z.object({
        studentAnswer: z.string().min(1),
        modelAnswer: z.string().min(1),
        question: z.string().min(1),
        scoringCriteria: z.object({
            clarity: z.number().min(0).max(100),
            accuracy: z.number().min(0).max(100),
            completeness: z.number().min(0).max(100),
            depth: z.number().min(0).max(100),
        }).optional(),
    })).min(1).max(50), // Limit to 50 essays per batch
});

// Batch score multiple essays
export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated (teacher or admin)
        const user = await getCurrentUser(request);
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return NextResponse.json(
                { error: "Unauthorized. Teacher or admin access required." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = BatchScoreSchema.parse(body);

        // Score essays in batch
        const results = await batchScoreEssays(validatedData.essays);

        return NextResponse.json({
            success: true,
            results,
            count: results.length,
        });

    } catch (error) {
        console.error("Error batch scoring essays:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
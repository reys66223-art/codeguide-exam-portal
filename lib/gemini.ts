import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface EssayScoringResult {
    score: number;
    maxScore: number;
    percentage: number;
    feedback: string;
    confidence: number;
    breakdown: {
        clarity: number;
        accuracy: number;
        completeness: number;
        depth: number;
    };
    suggestions: string[];
}

export interface ScoringCriteria {
    clarity: number; // 0-100 - How clearly the student expresses their ideas
    accuracy: number; // 0-100 - Factual accuracy of the content
    completeness: number; // 0-100 - How completely the question is answered
    depth: number; // 0-100 - Depth of understanding and analysis
}

/**
 * Score an essay answer using Gemini AI
 * @param studentAnswer The student's essay answer
 * @param modelAnswer The teacher's model answer
 * @param question The question being asked
 * @param scoringCriteria Weighted criteria for scoring
 * @returns Scoring result with detailed feedback
 */
export async function scoreEssay(
    studentAnswer: string,
    modelAnswer: string,
    question: string,
    scoringCriteria?: ScoringCriteria
): Promise<EssayScoringResult> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Default criteria if not provided
        const defaultCriteria: ScoringCriteria = {
            clarity: 25,
            accuracy: 25,
            completeness: 25,
            depth: 25,
        };

        const criteria = scoringCriteria || defaultCriteria;

        // Create the scoring prompt
        const prompt = createScoringPrompt(
            studentAnswer,
            modelAnswer,
            question,
            criteria
        );

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the AI response
        return parseScoringResponse(text, criteria);

    } catch (error) {
        console.error("Error scoring essay with Gemini AI:", error);

        // Fallback scoring if AI fails
        return {
            score: 0,
            maxScore: 100,
            percentage: 0,
            feedback: "Unable to score essay automatically. Please review manually.",
            confidence: 0,
            breakdown: {
                clarity: 0,
                accuracy: 0,
                completeness: 0,
                depth: 0,
            },
            suggestions: ["Please review this answer manually."],
        };
    }
}

/**
 * Create a comprehensive scoring prompt for Gemini AI
 */
function createScoringPrompt(
    studentAnswer: string,
    modelAnswer: string,
    question: string,
    criteria: ScoringCriteria
): string {
    return `
You are an expert educator tasked with scoring student essay answers. Please analyze the student's response and provide a detailed evaluation.

**QUESTION:**
${question}

**MODEL ANSWER (for reference):**
${modelAnswer}

**STUDENT'S ANSWER:**
${studentAnswer}

**SCORING CRITERIA:**
- Clarity: ${criteria.clarity}% - How clearly the student expresses their ideas
- Accuracy: ${criteria.accuracy}% - Factual accuracy of the content
- Completeness: ${criteria.completeness}% - How completely the question is answered
- Depth: ${criteria.depth}% - Depth of understanding and analysis

**SCORING RUBRIC:**
- 90-100: Very appropriate, all important points are present
- 70-89: Appropriate but incomplete
- 50-69: Partially appropriate, some points are correct
- 30-49: Less appropriate, only a few points are correct
- 0-29: Inappropriate

**INSTRUCTIONS:**
1. Compare the student's answer to the model answer
2. Evaluate based on the provided criteria
3. Provide a score out of 100 points
4. Give detailed, constructive feedback
5. Suggest specific improvements
6. Rate your confidence in this scoring (0-100)

**RESPONSE FORMAT (JSON):**
{
    "score": 0-100,
    "feedback": "Detailed feedback explaining the score",
    "confidence": 0-100,
    "breakdown": {
        "clarity": 0-100,
        "accuracy": 0-100,
        "completeness": 0-100,
        "depth": 0-100
    },
    "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
}

Please provide your analysis in the exact JSON format specified above.
`;
}

/**
 * Parse the AI response and ensure it's valid
 */
function parseScoringResponse(response: string, criteria: ScoringCriteria): EssayScoringResult {
    try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and normalize the response
        const score = Math.max(0, Math.min(100, parsed.score || 0));
        const confidence = Math.max(0, Math.min(100, parsed.confidence || 50));

        return {
            score,
            maxScore: 100,
            percentage: score,
            feedback: parsed.feedback || "No feedback provided.",
            confidence,
            breakdown: {
                clarity: Math.max(0, Math.min(100, parsed.breakdown?.clarity || 0)),
                accuracy: Math.max(0, Math.min(100, parsed.breakdown?.accuracy || 0)),
                completeness: Math.max(0, Math.min(100, parsed.breakdown?.completeness || 0)),
                depth: Math.max(0, Math.min(100, parsed.breakdown?.depth || 0)),
            },
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        };

    } catch (error) {
        console.error("Error parsing AI response:", error);

        // Return a fallback result
        return {
            score: 50,
            maxScore: 100,
            percentage: 50,
            feedback: "Unable to parse AI scoring response. Please review manually.",
            confidence: 0,
            breakdown: {
                clarity: 50,
                accuracy: 50,
                completeness: 50,
                depth: 50,
            },
            suggestions: ["Please review this answer manually."],
        };
    }
}

/**
 * Batch score multiple essays
 */
export async function batchScoreEssays(
    essays: Array<{
        studentAnswer: string;
        modelAnswer: string;
        question: string;
        scoringCriteria?: ScoringCriteria;
    }>
): Promise<EssayScoringResult[]> {
    const results: EssayScoringResult[] = [];

    for (const essay of essays) {
        try {
            const result = await scoreEssay(
                essay.studentAnswer,
                essay.modelAnswer,
                essay.question,
                essay.scoringCriteria
            );
            results.push(result);
        } catch (error) {
            console.error("Error scoring essay:", error);

            // Add fallback result
            results.push({
                score: 0,
                maxScore: 100,
                percentage: 0,
                feedback: "Error scoring essay. Please review manually.",
                confidence: 0,
                breakdown: {
                    clarity: 0,
                    accuracy: 0,
                    completeness: 0,
                    depth: 0,
                },
                suggestions: ["Please review this answer manually."],
            });
        }
    }

    return results;
}

/**
 * Generate a summary of scoring results for a class
 */
export function generateScoringSummary(results: EssayScoringResult[]): {
    averageScore: number;
    averageConfidence: number;
    scoreDistribution: Record<string, number>;
    commonSuggestions: string[];
} {
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Calculate score distribution
    const scoreDistribution: Record<string, number> = {
        "90-100": 0,
        "70-89": 0,
        "50-69": 0,
        "30-49": 0,
        "0-29": 0,
    };

    results.forEach(result => {
        const score = result.percentage;
        if (score >= 90) scoreDistribution["90-100"]++;
        else if (score >= 70) scoreDistribution["70-89"]++;
        else if (score >= 50) scoreDistribution["50-69"]++;
        else if (score >= 30) scoreDistribution["30-49"]++;
        else scoreDistribution["0-29"]++;
    });

    // Find common suggestions
    const suggestionCounts: Record<string, number> = {};
    results.forEach(result => {
        result.suggestions.forEach(suggestion => {
            suggestionCounts[suggestion] = (suggestionCounts[suggestion] || 0) + 1;
        });
    });

    const commonSuggestions = Object.entries(suggestionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([suggestion]) => suggestion);

    return {
        averageScore: Math.round(averageScore),
        averageConfidence: Math.round(averageConfidence),
        scoreDistribution,
        commonSuggestions,
    };
}
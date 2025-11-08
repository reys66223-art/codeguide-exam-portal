import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        }
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Disable for easier testing in development
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    account: {
        accountLinking: {
            enabled: false,
        },
    },
    // Custom hooks for user registration to assign roles
    hooks: {
        after: [
            {
                matcher(context) {
                    return context.path === "/sign-up" && context.method === "POST";
                },
                handler: async (ctx) => {
                    // Automatically assign teacher role to users who sign up with email
                    // Students will be created through participant registration, not direct signup
                    if (ctx.body?.email && !ctx.body?.role) {
                        await db.update(user)
                            .set({ role: 'teacher' })
                            .where(eq(user.id, ctx.context?.newUser?.id || ''));
                    }
                },
            },
        ],
    },
    // Add custom fields to user model
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "student",
                input: false,
            },
            nisnId: {
                type: "string",
                required: false,
                input: false,
            },
            dateOfBirth: {
                type: "date",
                required: false,
                input: false,
            },
            phoneNumber: {
                type: "string",
                required: false,
                input: false,
            },
            school: {
                type: "string",
                required: false,
                input: false,
            },
            grade: {
                type: "string",
                required: false,
                input: false,
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            enabled: false, // Disabled by default, can be enabled
        },
    },
});
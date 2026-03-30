import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    trustedOrigins: [
        "https://sisaka.vercel.app",
        "http://localhost:3000",
        ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ],
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        await db.insert(schema.accessPermissions).values({
                            userId: user.id as string,
                            userName: user.name as string,
                            userRole: (user.role as "admin" | "psikolog" | "petugas") || "petugas",
                            canViewData: false,
                            canEditData: false,
                            canExportData: false,
                        });
                    } catch (error) {
                        console.error("Failed to insert access permissions for new user:", error);
                    }
                }
            }
        }
    },
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false,
            },
            location: {
                type: "string",
                required: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "petugas",
                input: true,
            },
            isApproved: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            failedLoginAttempts: {
                type: "number",
                required: false,
                defaultValue: 0,
            },
            lockedUntil: {
                type: "date",
                required: false,
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,      // 1 day
    },
});

export type Session = typeof auth.$Infer.Session;

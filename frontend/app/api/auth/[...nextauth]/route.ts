// /home/moumene/bem/frontend/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

// Ensure a single instance of Prisma is used in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "EpicGrad Guest Credentials",
      credentials: {
        name: { label: "Full Name", type: "text", placeholder: "Ahmed" },
        examType: { label: "Exam", type: "text", placeholder: "BAC" },
        grade: { label: "Grade", type: "text", placeholder: "EXCELLENT" },
        avatarColor: { label: "Avatar Color", type: "text", placeholder: "#3b82f6" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.examType || !credentials?.grade) {
          throw new Error("Missing required login credentials.");
        }

        try {
          // Persist user database entry via Prisma
          const user = await prisma.user.create({
            data: {
              name: credentials.name,
              examType: credentials.examType as any, // Casts to BEM or BAC enum
              grade: credentials.grade as any,      // Casts to GradeType enum
              avatarColor: credentials.avatarColor || "#3b82f6",
            },
          });

          // Return session payload
          return {
            id: user.id,
            name: user.name,
            examType: user.examType,
            grade: user.grade,
            avatarColor: user.avatarColor,
          };
        } catch (error) {
          console.error("Prisma authorization database write failed:", error);
          throw new Error("Could not log in guest. Please check database connection.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.examType = (user as any).examType;
        token.grade = (user as any).grade;
        token.avatarColor = (user as any).avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).examType = token.examType;
        (session.user as any).grade = token.grade;
        (session.user as any).avatarColor = token.avatarColor;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirects to landing page on authentication issues
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "epicgrad_secret_2026_algeria",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        
        const email = credentials.email.trim();
        const password = credentials.password.trim();

        // Explicitly allow the requested administrator credentials
        if (email === "admin@gmail.com" && password === "admin123") {
          try {
            // Try to upsert into DB if it exists
            const hash = await bcrypt.hash(password, 10);
            const user = await prisma.user.upsert({
              where: { email },
              update: {},
              create: {
                email,
                name: "System Administrator",
                passwordHash: hash,
                roles: {
                  create: { role: "ADMIN" }
                }
              },
              include: { roles: true }
            });
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              roles: ["ADMIN"],
            };
          } catch (e) {
            // Fallback if DB is not running yet
            return {
              id: "admin-mock-id",
              email: "admin@gmail.com",
              name: "System Administrator",
              roles: ["ADMIN"],
            };
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: true }
        });

        if (!user || !user.passwordHash) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Account is disabled");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map(r => r.role),
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
};

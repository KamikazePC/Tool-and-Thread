import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // Make sure the user ID is set correctly from the token
      if (token) {
        session.user = { 
          id: token.sub || '', 
          email: token.email || '', 
          name: token.name
        };
        
        // Add debug log
        console.log('Session callback - user ID:', token.sub);
      }
      
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Make sure user ID is set properly on the token
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // Add debug log
        console.log('JWT callback - user ID:', user.id);
      }
      return token;
    },
  },
};
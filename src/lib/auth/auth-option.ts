import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { prisma } from "@/lib/database/prisma-client";
import { z } from "zod";
import { compare } from "bcrypt";
import exclude from "../database/exlcude";
import { User } from "@prisma/client";

const google_client_id = process.env.GOOGLE_CLIENT_ID;
if (!google_client_id) throw new Error("GOOGLE_CLIENT_ID is missing on your .env.local file");
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET;
if (!google_client_secret) throw new Error("GOOGLE_CLIENT_SECRET is missing on your .env.local file");

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error("NEXTAUTH_SECRET is missing on your .env.local file");

// const facebook_client_id = process.env.FACEBOOK_CLIENT_ID;
// if (!facebook_client_id) throw new Error("FACEBOOK_CLIENT_ID");
// const facebook_client_secret = process.env.FACEBOOK_CLIENT_SECRET;
// if (!facebook_client_secret) throw new Error("FACEBOOK_CLIENT_SECRET");

const auth_options: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "email", type: "text", placeholder: "Email" },
        password: {
          label: "password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        if (!credentials) throw new Error("Email and Password is required");

        const { username, password } = credentials;
        try {
          const schema = z.object({
            username: z.string().startsWith("@"),
            password: z.string().min(8),
          });
          schema.parse({ username, password });
        } catch (error) {
          const zodError = error as z.ZodError;
          const errors = zodError.flatten().fieldErrors;
          throw new Error(errors["password"]?.[0] || errors["email"]?.[0]);
        }

        try {
          const user = await prisma.user.findUnique({ where: { username } });

          if (!user) throw new Error("User does not exist");
          if (user.provider === "GOOGLE") throw new Error("This User can only login using GOOGLE authentication");
          if (!(await compare(password, user.password!))) throw new Error("Password Incorrect");
          return exclude(user, ["password"]);
        } catch (error) {
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: google_client_id,
      clientSecret: google_client_secret,
    }),
    // FacebookProvider({
    //   clientId: facebook_client_id,
    //   clientSecret: facebook_client_secret,
    // }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/",
  },
  secret,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ profile }) {
      try {
        if (profile) {
          const user = await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true } });

          if (!user) {
            await prisma.user.create({
              data: {
                first_name: profile.given_name,
                last_name: profile.family_name,
                provider: "GOOGLE",
                username: "@" + profile.email?.slice(0, profile.email.indexOf("@")),
                contact: {},
                photo: {
                  create: {
                    type: "USER_PHOTO",
                    url: profile.picture,
                  },
                },
              },
            });
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, profile, user, trigger, session }) {
      if (trigger == "update") return { ...token, ...session };

      delete token.sub;
      delete token.name;
      delete token.sub;
      delete token.picture;
      delete token.jti;

      try {
        if (profile) {
          const user = await prisma.user.findUnique({ where: { email: profile.email } });

          return { ...token, ...user };
        }
        return { ...token, ...user };
      } catch (error) {
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        session.user = token as User;
        return session;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default auth_options;

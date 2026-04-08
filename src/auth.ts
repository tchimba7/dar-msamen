import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { loginSchema } from "@/lib/auth-schema";
import { isMissingSchemaError, MISSING_SCHEMA_MESSAGE } from "@/lib/db-errors";
import { isPhoneVerificationRequired } from "@/lib/verification-policy";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/fr/connexion",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const phoneVerificationRequired = isPhoneVerificationRequired();
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const [{ db }, { verifyPassword }] = await Promise.all([
          import("@/lib/db"),
          import("@/lib/password"),
        ]);

        const user = await db.query.users.findFirst({
          where: (table, { eq: eqOperator }) => eqOperator(table.email, parsed.data.email),
        });

        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          adminOwnerId: user.adminOwnerId,
          phoneVerified: !phoneVerificationRequired || Boolean(user.phoneVerifiedAt),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const phoneVerificationRequired = isPhoneVerificationRequired();

      if (user) {
        token.role = user.role;
        token.adminOwnerId = user.adminOwnerId ?? null;
        token.phoneVerified = !phoneVerificationRequired || Boolean(user.phoneVerified);
      }

      if (!phoneVerificationRequired && token.role === "CLIENT") {
        token.phoneVerified = true;
      } else if (!user && token.sub && token.role === "CLIENT") {
        try {
          const { db } = await import("@/lib/db");
          const { users } = await import("@/db/schema");
          const { eq } = await import("drizzle-orm");

          const [currentUser] = await db
            .select({ phoneVerifiedAt: users.phoneVerifiedAt })
            .from(users)
            .where(eq(users.id, token.sub))
            .limit(1);

          token.phoneVerified = Boolean(currentUser?.phoneVerifiedAt);
        } catch (error) {
          // Keep existing token state if DB is temporarily unavailable.
          token.phoneVerified = Boolean(token.phoneVerified);
          if (isMissingSchemaError(error)) {
            console.error(`[auth] ${MISSING_SCHEMA_MESSAGE}`);
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | undefined) ?? "CLIENT";
        session.user.adminOwnerId =
          (token.adminOwnerId as string | null | undefined) ?? null;
        session.user.phoneVerified = Boolean(token.phoneVerified);
      }
      return session;
    },
  },
  events: {
    async signIn() {
      // Keep this hook for future audit logging.
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

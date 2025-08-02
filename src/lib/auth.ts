import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  events: {
    async signOut(message) {
      // Force clear any problematic session data
      console.log('User signed out:', message);
    },
  },
  // Handle JWT errors by clearing the session
  logger: {
    error(code) {
      if (code === 'JWT_SESSION_ERROR') {
        console.log('JWT session error detected, clearing session');
      }
    },
  },
});

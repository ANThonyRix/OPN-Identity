import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0",
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;

        // Debug: log the full profile to see structure
        console.log("[NextAuth] provider:", account.provider);
        console.log("[NextAuth] profile:", JSON.stringify(profile, null, 2));

        // Twitter v2 may nest under `data`, or have it at top level
        const twitterUsername =
          (profile as any)?.data?.username ||
          (profile as any)?.username ||
          (profile as any)?.screen_name;
        const fallbackUsername = (profile as { name?: string })?.name;
        token.username = twitterUsername || fallbackUsername || account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        provider: token.provider,
        providerAccountId: token.providerAccountId,
        username: token.username,
      };
    },
  },
  pages: {
    signIn: "/verify",
  },
});

export { handler as GET, handler as POST };

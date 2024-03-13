import type { Provider } from "@auth/core/providers";
import NotionProvider from "@auth/core/providers/notion";
// import { D1Adapter } from "@auth/d1-adapter";
import { serverAuth$ } from "@builder.io/qwik-auth";

// import { database } from "~/routes/plugin@01-database";

declare module "@auth/core/types" {
  interface Session {
    accessToken?: string;
  }
}

export const { onRequest, useAuthSession, useAuthSignin, useAuthSignout } =
  serverAuth$((e) => {
    // const db = database(e);
    return {
      secret: e.env.get("AUTH_SECRET"),
      trustHost: true,
      // adapter: <any>D1Adapter(db),
      callbacks: {
        jwt({ account, token }) {
          if (account) {
            token.accessToken = account.access_token;
          }
          return token;
        },
        async session({ session, token }) {
          session.accessToken = token.accessToken as string;
          return session;
        },
      },
      providers: [
        // Google({
        //   clientId: env.get("GOOGLE_CLIENT_ID")!,
        //   clientSecret: env.get("GOOGLE_CLIENT_SECRET")!,
        // }),
        NotionProvider({
          clientId: e.env.get("NOTION_CLIENT_ID")!,
          clientSecret: e.env.get("NOTION_CLIENT_SECRET")!,
          redirectUri: e.env.get("NOTION_REDIRECT_URI")!,
        }),
      ] as Provider[],
    };
  });

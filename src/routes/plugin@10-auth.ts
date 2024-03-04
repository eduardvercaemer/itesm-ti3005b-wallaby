import type { Provider } from "@auth/core/providers";
import Google from "@auth/core/providers/google";
import { serverAuth$ } from "@builder.io/qwik-auth";

export const { onRequest, useAuthSession, useAuthSignin, useAuthSignout } =
  serverAuth$(({ env }) => ({
    secret: env.get("AUTH_SECRET"),
    trustHost: true,
    providers: [
      Google({
        clientId: env.get("GOOGLE_CLIENT_ID")!,
        clientSecret: env.get("GOOGLE_CLIENT_SECRET")!,
      }),
    ] as Provider[],
  }));

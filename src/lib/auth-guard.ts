import type { Session } from "@auth/core/types";
import { RequestEventCommon } from "@builder.io/qwik-city";

export function authGuard(event: RequestEventCommon) {
  const session: Session | null = event.sharedMap.get("session");
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(
      302,
      `/api/auth/signin?callbackUrl=${event.url.pathname}`,
    );
  }
}

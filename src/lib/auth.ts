import { D1Database } from "@cloudflare/workers-types";

export async function getUserAccessKey(
  db: D1Database,
  userId: string,
): Promise<string | null> {
  const result = await db
    .prepare(
      `SELECT access_token
       FROM "accounts"
       WHERE userId = ?
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ access_token: string | null }>();

  return result?.access_token ?? null;
}

import { D1Database } from "@cloudflare/workers-types";

export function getSetting(setting: string) {
  return async function (db: D1Database): Promise<string | null> {
    const result = await db
      .prepare(
        `SELECT value
         FROM setting
         WHERE key = ?
         LIMIT 1`,
      )
      .bind(setting)
      .first<{ value: string | null }>();

    return result?.value ?? null;
  };
}

export function setSetting(setting: string) {
  return async function setDatabaseId(
    db: D1Database,
    value: string,
  ): Promise<void> {
    await db
      .prepare(
        `INSERT INTO setting (key, value)
         VALUES (?, ?)
         ON CONFLICT DO UPDATE SET value = excluded.value`,
      )
      .bind(setting, value)
      .run();
  };
}

export function deleteSetting(setting: string) {
  return async function (db: D1Database): Promise<void> {
    await db
      .prepare(
        `DELETE
         FROM setting
         WHERE key = ?`,
      )
      .bind(setting)
      .run();
  };
}

export const getDatabaseId = getSetting("database_id");
export const setDatabaseId = setSetting("database_id");

export const getSchedule_ = getSetting("schedule");
export const setSchedule = setSetting("schedule");

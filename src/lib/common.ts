import { D1Database } from "@cloudflare/workers-types";
import { Client } from "@notionhq/client";
import { z } from "@builder.io/qwik-city";

/// SETTINGS APIS

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
    await db.prepare(`DELETE FROM setting WHERE key = ?`).bind(setting).run();
  };
}

export const getDatabaseId = getSetting("database_id");
export const setDatabaseId = setSetting("database_id");

export const getNotionSchedule = getSetting("notion_schedule");
export const setNotionSchedule = setSetting("notion_schedule");

/// NOTION APIS

const basicMultiSelectSchema = z
  .object({
    type: z.literal("multi_select"),
    multi_select: z.array(z.any()),
  })
  .transform((data) => data.multi_select.map((i) => i.name));

const basicTextSchema = z
  .object({
    type: z.literal("rich_text"),
    rich_text: z.array(z.any()),
  })
  .transform((data) => data.rich_text.map((i) => i.text.content).join(" "));

const scheduleSchema = z
  .object({
    results: z.array(
      z
        .object({
          object: z.literal("page"),
          id: z.string().uuid(),
          url: z.string().url(),
          properties: z.object({
            Grado: basicMultiSelectSchema,
            Maestro: basicMultiSelectSchema,
            Dia: basicMultiSelectSchema,
            Salón: basicMultiSelectSchema,
            Inicio: basicTextSchema,
            Fin: basicTextSchema,
            Titulo: z
              .object({
                type: z.literal("title"),
                title: z.array(
                  z.object({
                    type: z.literal("text"),
                    text: z.object({ content: z.string() }),
                  }),
                ),
              })
              .transform((i) => i.title[0].text.content),
          }),
        })
        .transform((i) => ({
          id: i.id,
          url: i.url,
          title: i.properties.Titulo,
          grade: i.properties.Grado,
          teacher: i.properties.Maestro,
          day: i.properties.Dia,
          room: i.properties["Salón"],
          start: i.properties.Inicio,
          end: i.properties.Fin,
        })),
    ),
  })
  .transform((data) => data.results);

export async function getSchedule(
  db: D1Database,
  notion: Client,
  options?: { forceReload: boolean },
): Promise<z.infer<typeof scheduleSchema>> {
  /// Attempt local cache
  const cachedNotionSchedule = options?.forceReload
    ? null
    : await getNotionSchedule(db);

  if (cachedNotionSchedule) {
    console.debug("USING CACHED SCHEDULE");
    return await scheduleSchema.parseAsync(JSON.parse(cachedNotionSchedule));
  }

  const databaseId = await getDatabaseId(db);
  if (!databaseId) {
    throw new Error("missing databaseId");
  }

  const response = await notion.databases.query({ database_id: databaseId });
  const schedule = await scheduleSchema.parseAsync(response);

  console.debug("UPDATING SCHEDULE IN DATABASE");
  await setNotionSchedule(db, JSON.stringify(response));

  return schedule;
}

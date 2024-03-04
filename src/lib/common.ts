import { D1Database } from "@cloudflare/workers-types";
import { Client } from "@notionhq/client";
import { z } from "@builder.io/qwik-city";

export async function getDatabaseId(db: D1Database): Promise<string | null> {
  const result = await db
    .prepare(
      `SELECT value
       FROM setting
       WHERE key = ?
       LIMIT 1`,
    )
    .bind("database_id")
    .first<{ value: string | null }>();

  return result?.value ?? null;
}

export async function setDatabaseId(
  db: D1Database,
  value: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO setting (key, value)
       VALUES (?, ?)
       ON CONFLICT DO UPDATE SET value = excluded.value`,
    )
    .bind("database_id", value)
    .run();
}

const basicMultiSelect = z
  .object({
    type: z.literal("multi_select"),
    multi_select: z.array(z.any()),
  })
  .transform((data) => data.multi_select.map((i) => i.name));

const basicText = z
  .object({
    type: z.literal("rich_text"),
    rich_text: z.array(z.any()),
  })
  .transform((data) => data.rich_text.map((i) => i.text.content).join(" "));

export async function getSchedule(db: D1Database, notion: Client) {
  const databaseId = await getDatabaseId(db);
  if (!databaseId) {
    throw new Error("missing databaseId");
  }

  const response = await notion.databases.query({ database_id: databaseId });
  console.debug(response);
  return await z
    .object({
      results: z.array(
        z
          .object({
            object: z.literal("page"),
            id: z.string().uuid(),
            url: z.string().url(),
            properties: z.object({
              Grado: basicMultiSelect,
              Maestro: basicMultiSelect,
              Dia: basicMultiSelect,
              Salón: basicMultiSelect,
              Inicio: basicText,
              Fin: basicText,
            }),
          })
          .transform((i) => ({
            id: i.id,
            url: i.url,
            grade: i.properties.Grado,
            teacher: i.properties.Maestro,
            day: i.properties.Dia,
            room: i.properties["Salón"],
            start: i.properties.Inicio,
            end: i.properties.Fin,
          })),
      ),
    })
    .transform((data) => data.results)
    .parseAsync(response);
}

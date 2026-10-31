import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

/**
 * Applies drizzle/NNNN_*.sql at startup, once, in order (additive migrations only).
 *
 * Databases created before this migrator existed (docker init SQL, Cloud SQL import,
 * v1.1.0/v1.2.0) have no journal: the state is inferred from the schema itself, so
 * only the missing migrations run. A MySQL named lock keeps concurrent instances
 * from migrating at the same time.
 */

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const JOURNAL = "__sdg_migrations";

/** How to recognise each migration as already applied on a journal-less database. */
const FINGERPRINTS: Record<
  string,
  { tables?: string[]; columns?: Array<[string, string]> }
> = {
  "0000": { tables: ["users", "assessment_responses"] },
  "0001": { tables: ["prospect_submissions"] },
  "0002": { columns: [["prospect_submissions", "interlocutors"]] },
  "0003": { columns: [["prospect_submissions", "privacyNoticeVersion"]] },
  "0004": {
    tables: ["lead_activities"],
    columns: [["prospect_submissions", "lastContactAt"]],
  },
};

export function migrationsDir() {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.resolve(import.meta.dirname, "..", "drizzle"), // dist/index.js -> /app/drizzle
    path.resolve(import.meta.dirname, "..", "..", "drizzle"), // server/_core (dev)
  ].filter((p): p is string => Boolean(p));
  return candidates.find(dir => fs.existsSync(dir));
}

export function listMigrations(dir: string) {
  return fs
    .readdirSync(dir)
    .filter(file => /^\d{4}_.*\.sql$/.test(file))
    .sort()
    .map(file => ({
      id: file.slice(0, 4),
      file,
      statements: splitStatements(
        fs.readFileSync(path.join(dir, file), "utf8")
      ),
    }));
}

export function splitStatements(source: string) {
  return source
    .split("--> statement-breakpoint")
    .map(chunk =>
      chunk
        .split("\n")
        .filter(line => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

const rows = (result: unknown) =>
  (result as [Array<Record<string, unknown>>])[0];

async function tableExists(db: Db, table: string) {
  const result = await db.execute(
    sql`select count(*) as n from information_schema.tables where table_schema = database() and table_name = ${table}`
  );
  return Number(rows(result)[0]?.n) > 0;
}

async function columnExists(db: Db, table: string, column: string) {
  const result = await db.execute(
    sql`select count(*) as n from information_schema.columns where table_schema = database() and table_name = ${table} and column_name = ${column}`
  );
  return Number(rows(result)[0]?.n) > 0;
}

async function looksApplied(db: Db, id: string) {
  const print = FINGERPRINTS[id];
  if (!print) return false;
  for (const table of print.tables ?? [])
    if (!(await tableExists(db, table))) return false;
  for (const [table, column] of print.columns ?? [])
    if (!(await columnExists(db, table, column))) return false;
  return true;
}

export async function runMigrations(
  log: (message: string) => void = message =>
    console.log(`[Migrate] ${message}`)
) {
  const db = await getDb();
  const dir = migrationsDir();
  if (!db || !dir) {
    log(
      !db
        ? "sin base de datos; se omite"
        : "no se encontró el directorio de migraciones; se omite"
    );
    return { applied: [] as string[] };
  }

  const lock = rows(
    await db.execute(sql`select get_lock('sdg_migrate', 60) as ok`)
  )[0]?.ok;
  if (Number(lock) !== 1)
    throw new Error("No se obtuvo el candado de migración.");
  const applied: string[] = [];
  try {
    const hadJournal = await tableExists(db, JOURNAL);
    await db.execute(
      sql.raw(
        `create table if not exists \`${JOURNAL}\` (id varchar(16) primary key, file varchar(255) not null, appliedAt timestamp not null default current_timestamp)`
      )
    );
    const done = new Set(
      rows(await db.execute(sql.raw(`select id from \`${JOURNAL}\``))).map(
        row => String(row.id)
      )
    );

    for (const migration of listMigrations(dir)) {
      if (done.has(migration.id)) continue;
      if (!hadJournal && (await looksApplied(db, migration.id))) {
        await db.execute(
          sql`insert into ${sql.raw(`\`${JOURNAL}\``)} (id, file) values (${migration.id}, ${migration.file})`
        );
        log(`${migration.file}: ya presente en el esquema, registrada`);
        continue;
      }
      for (const statement of migration.statements)
        await db.execute(sql.raw(statement));
      await db.execute(
        sql`insert into ${sql.raw(`\`${JOURNAL}\``)} (id, file) values (${migration.id}, ${migration.file})`
      );
      applied.push(migration.file);
      log(`${migration.file}: aplicada`);
    }
  } finally {
    await db.execute(sql`select release_lock('sdg_migrate')`);
  }
  return { applied };
}

import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT f.id, f.name, f.created_at, COUNT(j.id)::int AS entry_count
    FROM "Folder" f
    LEFT JOIN "Journal" j ON j.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.name`;
  return Response.json(rows);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  const [row] = await sql`
    INSERT INTO "Folder" (name) VALUES (${name.trim()})
    RETURNING id, name, created_at, 0 AS entry_count`;
  return Response.json(row, { status: 201 });
}

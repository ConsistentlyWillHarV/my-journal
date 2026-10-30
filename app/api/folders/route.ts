import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT f.id, f.name, f.parent_id, f.created_at,
           COUNT(j.id)::int AS entry_count
    FROM "Folder" f
    LEFT JOIN "Journal" j ON j.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.name`;
  return Response.json(rows);
}

export async function POST(request: Request) {
  const { name, parent_id } = await request.json();
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  const parentId = Number.isInteger(parent_id) ? parent_id : null;
  const [row] = await sql`
    INSERT INTO "Folder" (name, parent_id) VALUES (${name.trim()}, ${parentId})
    RETURNING id, name, parent_id, created_at, 0 AS entry_count`;
  return Response.json(row, { status: 201 });
}

import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT j.id, j.title, j.notes, j.created_at, j.photos, j.folder_id,
           f.name AS folder_name
    FROM "Journal" j
    LEFT JOIN "Folder" f ON f.id = j.folder_id
    ORDER BY j.created_at DESC`;
  return Response.json(rows);
}

export async function POST(request: Request) {
  const { title, notes, photos, folder_id, created_at } = await request.json();
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  const photoList: string[] = Array.isArray(photos)
    ? photos.filter((p) => typeof p === "string").slice(0, 6)
    : [];
  const folderId = Number.isInteger(folder_id) ? folder_id : null;
  const date = created_at ? new Date(created_at) : null;
  const createdAt = date && !isNaN(date.getTime()) ? date.toISOString() : null;
  const [row] = await sql`
    INSERT INTO "Journal" (title, notes, photos, folder_id, created_at)
    VALUES (${title.trim()}, ${typeof notes === "string" ? notes.trim() : ""}, ${photoList}, ${folderId}, COALESCE(${createdAt}::timestamptz, now()))
    RETURNING id, title, notes, created_at, photos, folder_id`;
  return Response.json(row, { status: 201 });
}

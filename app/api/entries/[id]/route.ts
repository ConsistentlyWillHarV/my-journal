import { sql } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, notes, folder_id } = await request.json();
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  const folderId = Number.isInteger(folder_id) ? folder_id : null;
  const [row] = await sql`
    UPDATE "Journal"
    SET title = ${title.trim()},
        notes = ${typeof notes === "string" ? notes : ""},
        folder_id = ${folderId}
    WHERE id = ${Number(id)}
    RETURNING id, title, notes, created_at, photos, folder_id`;
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`DELETE FROM "Journal" WHERE id = ${Number(id)}`;
  return new Response(null, { status: 204 });
}

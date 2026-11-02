import { sql } from "@/lib/db";
import { MAX_PHOTOS } from "@/lib/images";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, notes, folder_id, photos } = await request.json();
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  const folderId = Number.isInteger(folder_id) ? folder_id : null;
  // Only touch the photos when the request sends them.
  const photoList: string[] | null = Array.isArray(photos)
    ? photos.filter((p) => typeof p === "string").slice(0, MAX_PHOTOS)
    : null;
  const [row] = await sql`
    UPDATE "Journal"
    SET title = ${title.trim()},
        notes = ${typeof notes === "string" ? notes : ""},
        folder_id = ${folderId},
        photos = COALESCE(${photoList}::text[], photos)
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

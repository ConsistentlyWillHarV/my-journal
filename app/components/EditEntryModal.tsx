"use client";

import { useEffect, useState } from "react";
import { folderPath, sortedByPath, type FolderNode } from "@/lib/folders";
import { MAX_PHOTOS, resizeImage } from "@/lib/images";

type EditableEntry = {
  id: number;
  title: string;
  notes: string;
  photos: string[];
  folder_id: number | null;
};

// Edit an entry in a pop-up over the current page.
export default function EditEntryModal({
  entry,
  folders,
  onClose,
  onSaved,
}: {
  entry: EditableEntry;
  folders: FolderNode[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [notes, setNotes] = useState(entry.notes);
  const [folder, setFolder] = useState(
    entry.folder_id ? String(entry.folder_id) : ""
  );
  const [photos, setPhotos] = useState<string[]>(entry.photos ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const added = await Promise.all(
      Array.from(files).slice(0, room).map(resizeImage)
    );
    setPhotos((previous) => [...previous, ...added]);
  }

  async function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          photos,
          folder_id: folder ? Number(folder) : null,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved();
      onClose();
    } catch {
      alert("Could not save changes. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Edit entry"
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl space-y-3 rounded-2xl border border-[#e9e5da] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#82917b]">Edit entry</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#85877d] hover:text-[#353b32]"
          >
            ✕
          </button>
        </div>

        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
          className="w-full rounded-xl border border-[#e9e5da] px-3 py-2 font-semibold outline-none focus:border-[#82917b]"
        />
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          aria-label="Folder"
          className="w-full rounded-xl border border-[#e9e5da] bg-white px-3 py-2 outline-none focus:border-[#82917b]"
        >
          <option value="">No folder</option>
          {sortedByPath(folders).map((f) => (
            <option key={f.id} value={f.id}>
              {folderPath(folders, f.id)}
            </option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          aria-label="Notes"
          className="w-full resize-y rounded-xl bg-[#faf9f6] p-3 text-sm leading-6 outline-none focus:ring-1 focus:ring-[#82917b]"
        />
        <p className="text-xs text-[#85877d]">
          Checklist items are lines starting with &quot;- [ ] &quot;.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          aria-label="Add photos"
          disabled={photos.length >= MAX_PHOTOS}
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = "";
          }}
          className="block w-full text-sm text-[#85877d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef1e8] file:px-4 file:py-2 file:text-[#60745d]"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-xs shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 text-sm">
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="rounded-lg bg-[#73876f] px-4 py-1.5 text-white disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="text-[#85877d] hover:underline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

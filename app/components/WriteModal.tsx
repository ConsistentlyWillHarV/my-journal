"use client";

import { useEffect, useState } from "react";
import { withChecklist } from "@/lib/checklist";
import { MAX_PHOTOS, resizeImage } from "@/lib/images";

// A write form that pops up over the current page and saves the entry into
// one folder, so you never leave the page you are on.
export default function WriteModal({
  folderId,
  folderLabel,
  onClose,
  onSaved,
}: {
  folderId: number;
  folderLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [entryDate, setEntryDate] = useState("");
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
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes: withChecklist(content, checklist),
          photos,
          folder_id: folderId,
          created_at: entryDate ? new Date(entryDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved();
      onClose();
    } catch {
      alert("Could not save your entry. Please try again.");
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
        aria-label="Write an entry"
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-2xl border border-[#e9e5da] bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#82917b]">📁 Writing in {folderLabel}</p>
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
          placeholder="Title of the Day"
          aria-label="Title"
          className="mt-3 w-full border-b border-[#ece9e1] bg-transparent py-3 text-lg outline-none placeholder:text-[#b7b8ae] focus:border-[#82917b]"
        />

        <input
          type="datetime-local"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          aria-label="Date and time (leave empty for now)"
          className="mt-4 w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-2 text-sm outline-none focus:border-[#82917b]"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write whatever is on your mind..."
          rows={8}
          aria-label="Your thoughts"
          className="mt-4 w-full resize-y rounded-xl bg-[#faf9f6] p-4 leading-7 outline-none placeholder:text-[#b7b8ae] focus:ring-1 focus:ring-[#82917b]"
        />

        <div className="mt-4 space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="checkbox" disabled aria-hidden />
              <input
                value={item}
                autoFocus
                onChange={(e) =>
                  setChecklist((c) =>
                    c.map((x, j) => (j === i ? e.target.value : x))
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setChecklist((c) => [...c, ""]);
                  }
                }}
                placeholder="Checklist item"
                aria-label={`Checklist item ${i + 1}`}
                className="w-full border-b border-[#ece9e1] bg-transparent py-1 outline-none focus:border-[#82917b]"
              />
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => setChecklist((c) => c.filter((_, j) => j !== i))}
                className="text-xs text-[#a16e65]"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setChecklist((c) => [...c, ""])}
            className="text-sm text-[#60745d] hover:underline"
          >
            + Add checklist item
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          aria-label="Photos"
          disabled={photos.length >= MAX_PHOTOS}
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = "";
          }}
          className="mt-4 block w-full text-sm text-[#85877d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef1e8] file:px-4 file:py-2 file:text-[#60745d]"
        />
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
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

        <div className="mt-5 flex gap-3">
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="flex-1 rounded-xl bg-[#73876f] px-5 py-3 font-medium text-white transition hover:bg-[#60745d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save my entry ✨"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-[#85877d] hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

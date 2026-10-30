"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import { withChecklist } from "@/lib/checklist";

type Folder = { id: number; name: string };

const MAX_PHOTOS = 6;
const DRAFT_KEY = "journal-draft";

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [entryDate, setEntryDate] = useState("");

  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (draft) {
        setFolderId(draft.folderId ?? "");
        setTitle(draft.title ?? "");
        setContent(draft.content ?? "");
        setChecklist(draft.checklist ?? []);
        setPhotos(draft.photos ?? []);
        setEntryDate(draft.entryDate ?? "");
      }
    } catch {}
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const draft = { folderId, title, content, checklist, photos, entryDate };
    const isEmpty =
      !title && !content && !entryDate && !folderId && !checklist.length && !photos.length;
    try {
      if (isEmpty) return localStorage.removeItem(DRAFT_KEY);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Photos can exceed the storage quota; keep the text at least.
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, photos: [] }));
      }
    } catch {}
  }, [draftLoaded, folderId, title, content, checklist, photos, entryDate]);

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then(setFolders)
      .catch(() => console.error("Could not load folders."));
  }, []);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const added = await Promise.all(
      Array.from(files).slice(0, room).map(resizeImage)
    );
    setPhotos((previous) => [...previous, ...added]);
  }

  async function saveEntry() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes: withChecklist(content, checklist),
          photos,
          folder_id: folderId ? Number(folderId) : null,
          created_at: entryDate ? new Date(entryDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setContent("");
      setChecklist([]);
      setPhotos([]);
      setEntryDate("");
      setSaved(true);
    } catch {
      alert("Could not save your entry. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] text-[#353b32]">
      <Header />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-[#82917b]"></p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          
        </h1>
        <p className="mt-3 text-[#85877d]">
         
        </p>

        <div className="mt-8 rounded-2xl border border-[#e9e5da] bg-white p-6 shadow-sm">
          <label className="text-sm font-medium" htmlFor="title">
            "Title of the day"
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of the Day"
            className="mt-2 w-full border-b border-[#ece9e1] bg-transparent py-3 text-lg outline-none placeholder:text-[#b7b8ae] focus:border-[#82917b]"
          />

          <label
            className="mt-6 block text-sm font-medium"
            htmlFor="entry-date"
          >
            Date &amp; time
          </label>
          <input
            id="entry-date"
            type="datetime-local"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 outline-none focus:border-[#82917b]"
          />
          <p className="mt-2 text-xs text-[#85877d]">
            Leave empty to use the current date and time.
          </p>

          <label
            className="mt-6 block text-sm font-medium"
            htmlFor="folder"
          >
            Save to folder
          </label>
          <select
            id="folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 outline-none focus:border-[#82917b]"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {folders.length === 0 && (
            <p className="mt-2 text-xs text-[#85877d]">
              No folders yet.{" "}
              <Link href="/folders" className="text-[#60745d] hover:underline">
                Create one
              </Link>
            </p>
          )}

          <label
            className="mt-6 block text-sm font-medium"
            htmlFor="content"
          >
            Your thoughts
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write whatever is on your mind..."
            rows={8}
            className="mt-3 w-full resize-y rounded-xl bg-[#faf9f6] p-4 leading-7 outline-none placeholder:text-[#b7b8ae] focus:ring-1 focus:ring-[#82917b]"
          />

          <p className="mt-6 text-sm font-medium">Checklist</p>
          <div className="mt-2 space-y-2">
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
                  onClick={() =>
                    setChecklist((c) => c.filter((_, j) => j !== i))
                  }
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

          <label
            className="mt-6 block text-sm font-medium"
            htmlFor="photos"
          >
            Photos
          </label>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            disabled={photos.length >= MAX_PHOTOS}
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
            className="mt-2 block w-full text-sm text-[#85877d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef1e8] file:px-4 file:py-2 file:text-[#60745d]"
          />
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() =>
                      setPhotos((p) => p.filter((_, j) => j !== i))
                    }
                    className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-xs shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={saveEntry}
            disabled={!title.trim() || saving}
            className="mt-5 w-full rounded-xl bg-[#73876f] px-5 py-3 font-medium text-white transition hover:bg-[#60745d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save my entry ✨"}
          </button>

          {saved && (
            <p className="mt-4 text-center text-sm text-[#60745d]">
             
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#a1a196]">
         
        </p>
      </div>
    </main>
  );
}

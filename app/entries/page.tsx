"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";

type Entry = {
  id: number;
  title: string;
  notes: string;
  created_at: string;
  photos: string[];
  folder_id: number | null;
  folder_name: string | null;
};
type Folder = { id: number; name: string };

function Entries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState(
    useSearchParams().get("folder") ?? "all"
  );

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => console.error("Could not load entries."));
    fetch("/api/folders")
      .then((r) => r.json())
      .then(setFolders)
      .catch(() => console.error("Could not load folders."));
  }, []);

  async function deleteEntry(id: number) {
    if (!confirm("Delete this journal entry?")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) setEntries((previous) => previous.filter((e) => e.id !== id));
  }

  const filtered = entries.filter((entry) => {
    const inFolder =
      folder === "all" ||
      (folder === "none"
        ? entry.folder_id === null
        : String(entry.folder_id) === folder);
    return (
      inFolder &&
      `${entry.title} ${entry.notes}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">
        Past reflections
      </h1>
      <p className="mt-3 text-[#85877d]">Little pieces of your story.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your journal..."
          aria-label="Search journal entries"
          className="w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 outline-none focus:border-[#82917b]"
        />
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          aria-label="Filter by folder"
          className="rounded-xl border border-[#e9e5da] bg-white px-4 py-3 outline-none focus:border-[#82917b]"
        >
          <option value="all">All folders</option>
          <option value="none">Unfiled</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dcd9cf] p-6 text-center">
            <p className="text-3xl">🌱</p>
            <p className="mt-3 font-medium">No entries here yet</p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-[#60745d] hover:underline"
            >
              Write one →
            </Link>
          </div>
        ) : (
          filtered.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-[#e9e5da] bg-white p-5"
            >
              <div className="flex items-center justify-between gap-3 text-xs text-[#82917b]">
                <span>
                  {new Date(entry.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {entry.folder_name && <span>📁 {entry.folder_name}</span>}
              </div>
              <h3 className="mt-2 font-semibold">{entry.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#77796f]">
                {entry.notes}
              </p>
              {entry.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {entry.photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => deleteEntry(entry.id)}
                className="mt-4 text-xs text-[#a16e65] hover:underline"
              >
                Delete entry
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default function EntriesPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f0] text-[#353b32]">
      <Header />
      <Suspense>
        <Entries />
      </Suspense>
    </main>
  );
}

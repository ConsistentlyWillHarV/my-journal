"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import { parseNotes, toggleLine } from "@/lib/checklist";

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
  const [editing, setEditing] = useState<{
    id: number;
    title: string;
    notes: string;
    folder: string;
  } | null>(null);
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

  async function patchEntry(
    entry: Entry,
    changes: { title?: string; notes?: string; folder_id?: number | null }
  ) {
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: entry.title,
        notes: entry.notes,
        folder_id: entry.folder_id,
        ...changes,
      }),
    });
    if (!res.ok) {
      alert("Could not save changes. Please try again.");
      return false;
    }
    const updated = await res.json();
    setEntries((previous) =>
      previous.map((e) =>
        e.id === entry.id
          ? {
              ...e,
              ...updated,
              folder_name:
                folders.find((f) => f.id === updated.folder_id)?.name ?? null,
            }
          : e
      )
    );
    return true;
  }

  function toggleItem(entry: Entry, index: number) {
    patchEntry(entry, { notes: toggleLine(entry.notes, index) });
  }

  async function saveEdit() {
    if (!editing) return;
    const entry = entries.find((e) => e.id === editing.id);
    if (!entry) return;
    const ok = await patchEntry(entry, {
      title: editing.title,
      notes: editing.notes,
      folder_id: editing.folder ? Number(editing.folder) : null,
    });
    if (ok) setEditing(null);
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
              {editing?.id === entry.id ? (
                <div className="mt-3 space-y-3">
                  <input
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    aria-label="Title"
                    className="w-full rounded-xl border border-[#e9e5da] px-3 py-2 font-semibold outline-none focus:border-[#82917b]"
                  />
                  <select
                    value={editing.folder}
                    onChange={(e) =>
                      setEditing({ ...editing, folder: e.target.value })
                    }
                    aria-label="Folder"
                    className="w-full rounded-xl border border-[#e9e5da] bg-white px-3 py-2 outline-none focus:border-[#82917b]"
                  >
                    <option value="">No folder</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={editing.notes}
                    onChange={(e) =>
                      setEditing({ ...editing, notes: e.target.value })
                    }
                    rows={8}
                    aria-label="Notes"
                    className="w-full resize-y rounded-xl bg-[#faf9f6] p-3 text-sm leading-6 outline-none focus:ring-1 focus:ring-[#82917b]"
                  />
                  <p className="text-xs text-[#85877d]">
                    Checklist items are lines starting with &quot;- [ ] &quot;.
                  </p>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={saveEdit}
                      disabled={!editing.title.trim()}
                      className="rounded-lg bg-[#73876f] px-4 py-1.5 text-white disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-[#85877d] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-2 font-semibold">{entry.title}</h3>
                  <div className="mt-3 text-sm leading-6 text-[#77796f]">
                    {parseNotes(entry.notes).map((line) =>
                      line.kind === "item" ? (
                        <label
                          key={line.index}
                          className="flex cursor-pointer items-start gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={line.checked}
                            onChange={() => toggleItem(entry, line.index)}
                            className="mt-1.5"
                          />
                          <span
                            className={line.checked ? "line-through opacity-60" : ""}
                          >
                            {line.text}
                          </span>
                        </label>
                      ) : (
                        <p key={line.index} className="whitespace-pre-wrap">
                          {line.text || " "}
                        </p>
                      )
                    )}
                  </div>
                </>
              )}
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
              <div className="mt-4 flex gap-4 text-xs">
                <button
                  onClick={() =>
                    setEditing({
                      id: entry.id,
                      title: entry.title,
                      notes: entry.notes,
                      folder: entry.folder_id ? String(entry.folder_id) : "",
                    })
                  }
                  className="text-[#60745d] hover:underline"
                >
                  Edit entry
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-[#a16e65] hover:underline"
                >
                  Delete entry
                </button>
              </div>
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

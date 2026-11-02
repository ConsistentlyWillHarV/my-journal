"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import WriteModal from "../components/WriteModal";
import EditEntryModal from "../components/EditEntryModal";
import PhotoViewer from "../components/PhotoViewer";
import { folderPath } from "@/lib/folders";

type Folder = {
  id: number;
  name: string;
  parent_id: number | null;
  entry_count: number;
};
type Entry = {
  id: number;
  title: string;
  notes: string;
  created_at: string;
  photos: string[];
  folder_id: number | null;
};

function Folders() {
  const parentParam = useSearchParams().get("parent");
  const parentId = parentParam ? Number(parentParam) : null;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [writeTo, setWriteTo] = useState<Folder | null>(null);

  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  async function deleteEntry(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((previous) => previous.filter((e) => e.id !== entry.id));
      fetch("/api/folders")
        .then((r) => r.json())
        .then(setFolders);
    }
  }

  function loadEntries() {
    fetch("/api/entries")
      .then((res) => res.json())
      .then(setEntries)
      .catch(() => console.error("Could not load entries."));
  }

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then(setFolders)
      .catch(() => console.error("Could not load folders."));
    loadEntries();
  }, []);

  const here = entries.filter((e) => e.folder_id === parentId);
  const current = folders.find((f) => f.id === parentId) ?? null;
  const visible = folders.filter((f) => f.parent_id === parentId);
  const crumbs: Folder[] = [];
  for (
    let f = current;
    f && !crumbs.includes(f);
    f = folders.find((x) => x.id === f!.parent_id) ?? null
  ) {
    crumbs.unshift(f);
  }

  async function addFolder() {
    if (!name.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent_id: parentId }),
    });
    if (!res.ok) return alert("Could not create folder.");
    const folder: Folder = await res.json();
    setFolders((previous) => [...previous, folder]);
    setName("");
  }

  async function deleteFolder(folder: Folder) {
    const hasChildren = folders.some((f) => f.parent_id === folder.id);
    if (
      !confirm(
        `Delete "${folder.name}"${hasChildren ? " and all its subfolders" : ""}? Its entries will be kept, just unfiled.`
      )
    )
      return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    if (res.ok) {
      // The database removes subfolders too, so reload to stay in sync.
      const next = await fetch("/api/folders").then((r) => r.json());
      setFolders(next);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <nav className="text-sm text-[#82917b]" aria-label="Folder path">
        <Link href="/folders" className="hover:underline">
          Folders
        </Link>
        {crumbs.map((c) => (
          <span key={c.id}>
            {" / "}
            <Link href={`/folders?parent=${c.id}`} className="hover:underline">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        {current ? current.name : "Folders"}
      </h1>
      <p className="mt-3 text-[#85877d]">
        {current
          ? "Subfolders inside this folder."
          : "Organize your entries into folders."}
      </p>
      {current && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setWriteTo(current)}
            className="rounded-xl bg-[#73876f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#60745d]"
          >
            ✏️ Write here
          </button>
          <Link
            href={`/entries?folder=${current.id}`}
            className="text-sm text-[#60745d] hover:underline"
          >
            View entries in this folder ({current.entry_count}) →
          </Link>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addFolder();
        }}
        className="mt-8 flex gap-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={current ? "New subfolder name..." : "New folder name..."}
          aria-label="New folder name"
          className="w-full rounded-xl border border-[#e9e5da] bg-white px-4 py-3 outline-none focus:border-[#82917b]"
        />
        <button
          disabled={!name.trim()}
          className="rounded-xl bg-[#73876f] px-5 py-3 font-medium text-white transition hover:bg-[#60745d] disabled:opacity-40"
        >
          Add
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dcd9cf] p-6 text-center text-sm text-[#85877d]">
            <p className="text-3xl">📁</p>
            <p className="mt-3">
              {current
                ? "No subfolders yet. Create one above."
                : "No folders yet. Create your first one above."}
            </p>
          </div>
        ) : (
          visible.map((folder) => {
            const subCount = folders.filter(
              (f) => f.parent_id === folder.id
            ).length;
            return (
              <div
                key={folder.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#e9e5da] bg-white p-5"
              >
                <Link
                  href={`/folders?parent=${folder.id}`}
                  className="flex-1"
                  title={folderPath(folders, folder.id)}
                >
                  <span className="font-semibold">📁 {folder.name}</span>
                  <span className="ml-3 text-xs text-[#85877d]">
                    {folder.entry_count}{" "}
                    {folder.entry_count === 1 ? "entry" : "entries"}
                    {subCount > 0 &&
                      ` · ${subCount} ${subCount === 1 ? "subfolder" : "subfolders"}`}
                  </span>
                </Link>
                <button
                  onClick={() => setWriteTo(folder)}
                  className="rounded-lg bg-[#73876f] px-3 py-1 text-xs font-medium text-white hover:bg-[#60745d]"
                >
                  Write
                </button>
                <Link
                  href={`/entries?folder=${folder.id}`}
                  className="text-xs text-[#60745d] hover:underline"
                >
                  Entries
                </Link>
                <button
                  onClick={() => deleteFolder(folder)}
                  className="text-xs text-[#a16e65] hover:underline"
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>

      {here.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-[#82917b]">
            {current ? "Entries in this folder" : "Unfiled entries"}
          </h2>
          <div className="mt-3 space-y-3">
            {here.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[#e9e5da] bg-white p-5 hover:border-[#82917b]"
              >
                <Link
                  href={`/entries?folder=${entry.folder_id ?? "none"}`}
                  className="block"
                >
                  <span className="text-xs text-[#82917b]">
                    {new Date(entry.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <h3 className="mt-1 font-semibold">📝 {entry.title}</h3>
                  {entry.notes && (
                    <p className="mt-1 line-clamp-2 text-sm text-[#77796f]">
                      {entry.notes}
                    </p>
                  )}
                </Link>
                {entry.photos?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {entry.photos.map((src, i) => (
                      <PhotoViewer key={i} src={src} />
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-4 text-xs">
                  <button
                    onClick={() => setEditEntry(entry)}
                    className="text-[#60745d] hover:underline"
                  >
                    Edit entry
                  </button>
                  <button
                    onClick={() => deleteEntry(entry)}
                    className="text-[#a16e65] hover:underline"
                  >
                    Delete entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          folders={folders}
          onClose={() => setEditEntry(null)}
          onSaved={() => {
            loadEntries();
            fetch("/api/folders")
              .then((r) => r.json())
              .then(setFolders);
          }}
        />
      )}

      {writeTo && (
        <WriteModal
          folderId={writeTo.id}
          folderLabel={folderPath(folders, writeTo.id)}
          onClose={() => setWriteTo(null)}
          onSaved={() => {
            loadEntries();
            // entry counts live on the folders
            fetch("/api/folders")
              .then((res) => res.json())
              .then(setFolders);
          }}
        />
      )}
    </div>
  );
}

export default function FoldersPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f0] text-[#353b32]">
      <Header />
      <Suspense>
        <Folders />
      </Suspense>
    </main>
  );
}

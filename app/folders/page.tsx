"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../components/Header";

type Folder = { id: number; name: string; entry_count: number };

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then(setFolders)
      .catch(() => console.error("Could not load folders."));
  }, []);

  async function addFolder() {
    if (!name.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return alert("Could not create folder.");
    const folder: Folder = await res.json();
    setFolders((previous) =>
      [...previous, folder].sort((a, b) => a.name.localeCompare(b.name))
    );
    setName("");
  }

  async function deleteFolder(folder: Folder) {
    if (
      !confirm(
        `Delete "${folder.name}"? Its entries will be kept, just unfiled.`
      )
    )
      return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    if (res.ok) {
      setFolders((previous) => previous.filter((f) => f.id !== folder.id));
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] text-[#353b32]">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Folders</h1>
        <p className="mt-3 text-[#85877d]">
          Organize your entries into folders.
        </p>

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
            placeholder="New folder name..."
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
          {folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dcd9cf] p-6 text-center text-sm text-[#85877d]">
              <p className="text-3xl">📁</p>
              <p className="mt-3">
                No folders yet. Create your first one above.
              </p>
            </div>
          ) : (
            folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between rounded-2xl border border-[#e9e5da] bg-white p-5"
              >
                <Link href={`/entries?folder=${folder.id}`} className="flex-1">
                  <span className="font-semibold">📁 {folder.name}</span>
                  <span className="ml-3 text-xs text-[#85877d]">
                    {folder.entry_count}{" "}
                    {folder.entry_count === 1 ? "entry" : "entries"}
                  </span>
                </Link>
                <button
                  onClick={() => deleteFolder(folder)}
                  className="text-xs text-[#a16e65] hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

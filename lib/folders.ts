export type FolderNode = { id: number; name: string; parent_id: number | null };

// The folder and all its parents, outermost first.
export function folderChain<T extends FolderNode>(folders: T[], id: number): T[] {
  const chain: T[] = [];
  const seen = new Set<number>();
  let current = folders.find((f) => f.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = folders.find((f) => f.id === current!.parent_id);
  }
  return chain;
}

export function folderPath(folders: FolderNode[], id: number): string {
  const names: string[] = [];
  const seen = new Set<number>();
  let current = folders.find((f) => f.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = folders.find((f) => f.id === current!.parent_id);
  }
  return names.join(" / ");
}

export function sortedByPath<T extends FolderNode>(folders: T[]): T[] {
  return [...folders].sort((a, b) =>
    folderPath(folders, a.id).localeCompare(folderPath(folders, b.id))
  );
}

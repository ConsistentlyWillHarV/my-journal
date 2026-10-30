const ITEM = /^- \[( |x)\] (.*)$/;

export type NoteLine =
  | { kind: "text"; text: string; index: number }
  | { kind: "item"; text: string; checked: boolean; index: number };

export function parseNotes(notes: string): NoteLine[] {
  return notes.split("\n").map((line, index) => {
    const m = ITEM.exec(line);
    return m
      ? { kind: "item", text: m[2], checked: m[1] === "x", index }
      : { kind: "text", text: line, index };
  });
}

export function toggleLine(notes: string, index: number): string {
  return notes
    .split("\n")
    .map((line, i) => {
      const m = ITEM.exec(line);
      if (i !== index || !m) return line;
      return `- [${m[1] === "x" ? " " : "x"}] ${m[2]}`;
    })
    .join("\n");
}

export function withChecklist(notes: string, items: string[]): string {
  const lines = items.map((i) => i.trim()).filter(Boolean);
  if (lines.length === 0) return notes;
  const list = lines.map((i) => `- [ ] ${i}`).join("\n");
  return notes.trim() ? `${notes.trim()}\n\n${list}` : list;
}

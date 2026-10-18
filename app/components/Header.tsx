import Link from "next/link";

const links = [
  { href: "/", label: "Write" },
  { href: "/entries", label: "Entries" },
  { href: "/folders", label: "Folders" },
];

export default function Header() {
  return (
    <header className="border-b border-[#e8e5dc]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          little <span className="text-[#789078]">journal.</span>
        </Link>
        <nav className="flex gap-5 text-sm text-[#85877d]">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#353b32]">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

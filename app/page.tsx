import { redirect } from "next/navigation";

// There is no separate Write page: entries are written from inside a folder.
export default function Home() {
  redirect("/folders");
}

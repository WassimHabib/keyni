import { redirect } from "next/navigation";

export default function RootPage(): never {
  redirect("/tableau-de-bord");
}

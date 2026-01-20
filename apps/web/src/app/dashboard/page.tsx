import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardPage() {
  const user = getSessionUser();
  if (!user) redirect("/login");

  return <DashboardClient user={user} />;
}

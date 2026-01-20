export const dynamic = "force-dynamic";
export const revalidate = 0;

import DashboardClient from "./DashboardClient";
import { requireUser } from "@/lib/auth";

export default function DashboardPage() {
  const user = requireUser(); // server-side cookie check
  return <DashboardClient user={user} />;
}

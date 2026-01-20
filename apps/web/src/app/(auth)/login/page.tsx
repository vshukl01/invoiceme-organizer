// apps/web/src/app/(auth)/login/page.tsx
export const dynamic = "force-dynamic";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  // Server Component wrapper (no hooks here)
  return <LoginClient />;
}

// // apps/web/src/app/page.tsx
// import { redirect } from "next/navigation";

// export default function Home() {
//   redirect("/login");
// }
// apps/web/src/app/page.tsx
export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>InvoiceMe Organizer</h1>
      <p>Site is up. Auth is temporarily disabled.</p>
      <p>
        Go to <a href="/dashboard">/dashboard</a>
      </p>
    </main>
  );
}

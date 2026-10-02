import { isAdminRequest } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminRequest();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-asia-accent2">Host controls</p>
        <h1 className="mt-2 text-4xl font-black">Asiavision 2026 Admin</h1>
      </div>
      {authed ? <AdminDashboard /> : <AdminLogin />}
    </main>
  );
}

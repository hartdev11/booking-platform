import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Don't call Firebase Admin here — it can hang the server on first request and cause infinite loading.
// Tenant name is shown in sidebar; dashboard pages get tenantId from /api/auth/me on the client.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen force-dark bg-background">
      <AdminSidebar tenantName="" />
      <main className="md:pl-64 min-h-screen">{children}</main>
    </div>
  );
}

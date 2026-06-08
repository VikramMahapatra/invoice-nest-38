import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminLayout, AdminPageHeader, TenantStatusBadge } from "@/components/AdminLayout";
import { tenants, type TenantStatus } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/admin/tenants")({
  head: () => ({ meta: [{ title: "Tenants · BillKhata Admin" }] }),
  component: TenantsPage,
});

const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);
const STATUSES: (TenantStatus | "All")[] = ["All", "Active", "Trial", "Suspended", "Churned"];

function TenantsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TenantStatus | "All">("All");

  const filtered = useMemo(() => tenants.filter((t) => {
    const matchesQ = q === "" || (t.name + t.owner + t.gstin + t.email).toLowerCase().includes(q.toLowerCase());
    const matchesS = status === "All" || t.status === status;
    return matchesQ && matchesS;
  }), [q, status]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <AdminPageHeader
          title="Tenants"
          subtitle={`${tenants.length} businesses on the platform`}
          actions={
            <>
              <Button variant="outline" className="gap-1.5"><Download className="w-4 h-4" /> Export CSV</Button>
              <Button className="gap-1.5"><Plus className="w-4 h-4" /> Invite Tenant</Button>
            </>
          }
        />

        <div className="rounded-xl border bg-card">
          <div className="p-4 flex flex-wrap items-center gap-3 border-b">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search by name, owner, GSTIN, email…" />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 text-xs">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-2.5 h-7 rounded-[5px] ${status === s ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5"><Filter className="w-3.5 h-3.5" /> More filters</Button>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Tenant</th>
                  <th className="text-left font-medium px-3 py-2.5">GSTIN</th>
                  <th className="text-left font-medium px-3 py-2.5">Plan</th>
                  <th className="text-left font-medium px-3 py-2.5">Status</th>
                  <th className="text-right font-medium px-3 py-2.5">Users</th>
                  <th className="text-right font-medium px-3 py-2.5">MRR</th>
                  <th className="text-left font-medium px-3 py-2.5">Renews</th>
                  <th className="text-right font-medium px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link to="/admin/tenants/$id" params={{ id: t.id }} className="font-medium hover:text-primary">{t.name}</Link>
                      <div className="text-xs text-muted-foreground">{t.owner} · {t.state}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{t.gstin}</td>
                    <td className="px-3 py-3">{t.plan}</td>
                    <td className="px-3 py-3"><TenantStatusBadge status={t.status} /></td>
                    <td className="px-3 py-3 text-right tabular-nums">{t.users}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{inr(t.mrr)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{t.renewsOn}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to="/admin/tenants/$id" params={{ id: t.id }} className="text-xs text-primary font-medium hover:underline">Manage →</Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">No tenants match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y">
            {filtered.map((t) => (
              <Link key={t.id} to="/admin/tenants/$id" params={{ id: t.id }} className="block p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.owner} · {t.state}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-1">{t.gstin}</div>
                  </div>
                  <TenantStatusBadge status={t.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-muted-foreground">Plan</div><div className="font-medium">{t.plan}</div></div>
                  <div><div className="text-muted-foreground">MRR</div><div className="font-medium">{inr(t.mrr)}</div></div>
                  <div><div className="text-muted-foreground">Users</div><div className="font-medium">{t.users}</div></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

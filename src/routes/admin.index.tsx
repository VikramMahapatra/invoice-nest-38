import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout, AdminPageHeader, TenantStatusBadge } from "@/components/AdminLayout";
import { tenants, platformStats, tickets } from "@/lib/adminData";
import { Building2, TrendingUp, Wallet, FileText, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview · BillKhata" }] }),
  component: AdminOverview,
});

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

function AdminOverview() {
  const stats = [
    { label: "Total Tenants", value: fmt(platformStats.totalTenants), delta: "+12 this week", icon: Building2, tint: "bg-primary/10 text-primary" },
    { label: "Active MRR", value: inr(platformStats.mrr), delta: "+8.4% vs last mo", icon: Wallet, tint: "bg-success/15 text-success" },
    { label: "Projected ARR", value: inr(platformStats.arr), delta: "Forecast Q3 ₹2.4Cr", icon: TrendingUp, tint: "bg-info/15 text-info" },
    { label: "Invoices Processed", value: fmt(platformStats.invoicesProcessed), delta: "All-time platform", icon: FileText, tint: "bg-amber-500/15 text-amber-600" },
  ];

  const recent = tenants.slice(0, 6);
  const openTickets = tickets.filter((t) => t.status !== "Resolved").slice(0, 4);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <AdminPageHeader
          title="Platform overview"
          subtitle="Health of every tenant on BillKhata at a glance."
          actions={<Link to="/admin/tenants"><Button variant="outline" className="gap-1.5">View all tenants <ArrowUpRight className="w-4 h-4" /></Button></Link>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="p-5 rounded-xl border bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-semibold mt-2">{s.value}</div>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tint}`}><Icon className="w-4.5 h-4.5" /></div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-3">{s.delta}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 rounded-xl border bg-card">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Recent tenants</div>
                <div className="text-xs text-muted-foreground">Latest signups and renewals</div>
              </div>
              <Link to="/admin/tenants" className="text-xs text-primary font-medium hover:underline">See all →</Link>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">Tenant</th>
                    <th className="text-left font-medium px-3 py-2.5">Plan</th>
                    <th className="text-left font-medium px-3 py-2.5">Status</th>
                    <th className="text-right font-medium px-3 py-2.5">MRR</th>
                    <th className="text-right font-medium px-5 py-2.5">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <Link to="/admin/tenants/$id" params={{ id: t.id }} className="font-medium hover:text-primary">{t.name}</Link>
                        <div className="text-xs text-muted-foreground">{t.owner} · {t.state}</div>
                      </td>
                      <td className="px-3 py-3">{t.plan}</td>
                      <td className="px-3 py-3"><TenantStatusBadge status={t.status} /></td>
                      <td className="px-3 py-3 text-right tabular-nums">{inr(t.mrr)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{fmt(t.invoices)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y">
              {recent.map((t) => (
                <Link key={t.id} to="/admin/tenants/$id" params={{ id: t.id }} className="block px-5 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.plan} · {t.state}</div>
                    </div>
                    <TenantStatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="px-5 py-4 border-b">
              <div className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Open support tickets</div>
              <div className="text-xs text-muted-foreground">Needs attention</div>
            </div>
            <ul className="divide-y">
              {openTickets.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.subject}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.tenant} · {t.updated}</div>
                    </div>
                    <TenantStatusBadge status={t.priority} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t">
              <Link to="/admin/support" className="text-xs text-primary font-medium hover:underline">Open ticket queue →</Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

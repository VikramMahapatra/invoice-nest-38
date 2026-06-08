import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminPageHeader, TenantStatusBadge } from "@/components/AdminLayout";
import { billingHistory, platformStats } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Wallet, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Billing · BillKhata Admin" }] }),
  component: BillingPage,
});

const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

function BillingPage() {
  const collected = billingHistory.filter(b => b.status === "Paid").reduce((a, b) => a + b.amount, 0);
  const failed = billingHistory.filter(b => b.status === "Failed").reduce((a, b) => a + b.amount, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <AdminPageHeader
          title="Billing & revenue"
          subtitle="Subscription invoices across all tenants"
          actions={<Button variant="outline" className="gap-1.5"><Download className="w-4 h-4" /> Export</Button>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI icon={Wallet} tint="bg-success/15 text-success" label="Collected this cycle" value={inr(collected)} sub="June 2026" />
          <KPI icon={TrendingUp} tint="bg-primary/10 text-primary" label="Active MRR" value={inr(platformStats.mrr)} sub="+8.4% MoM" />
          <KPI icon={AlertCircle} tint="bg-destructive/10 text-destructive" label="Failed charges" value={inr(failed)} sub="1 invoice — needs retry" />
        </div>

        <div className="mt-6 rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <div className="text-sm font-semibold">Recent platform invoices</div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Invoice</th>
                  <th className="text-left font-medium px-3 py-2.5">Tenant</th>
                  <th className="text-left font-medium px-3 py-2.5">Plan</th>
                  <th className="text-left font-medium px-3 py-2.5">Date</th>
                  <th className="text-left font-medium px-3 py-2.5">Method</th>
                  <th className="text-right font-medium px-3 py-2.5">Amount</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs">{b.id}</td>
                    <td className="px-3 py-3 font-medium">{b.tenant}</td>
                    <td className="px-3 py-3">{b.plan}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{b.date}</td>
                    <td className="px-3 py-3 text-xs">{b.method}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{inr(b.amount)}</td>
                    <td className="px-5 py-3"><TenantStatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y">
            {billingHistory.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-medium">{b.tenant}</div>
                    <div className="text-xs text-muted-foreground">{b.id} · {b.date}</div>
                  </div>
                  <TenantStatusBadge status={b.status} />
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{b.plan} · {b.method}</span>
                  <span className="font-semibold tabular-nums">{inr(b.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KPI({ icon: Icon, tint, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; tint: string; label: string; value: string; sub: string }) {
  return (
    <div className="p-5 rounded-xl border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-2">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}><Icon className="w-4 h-4" /></div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-3">{sub}</div>
    </div>
  );
}

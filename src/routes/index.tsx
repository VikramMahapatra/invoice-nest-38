import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Wallet, FileText, AlertCircle, Plus, ArrowUpRight, IndianRupee, Eye } from "lucide-react";
import { AppLayout, PageHeader, StatusBadge } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, invoicePaid, rolePermissions, useStore } from "@/lib/store";
import { inr, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Sharma Traders" },
      { name: "description", content: "GST invoices, payments, receivables and net profit at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { invoices, customers, business, expenses, currentRole } = useStore();
  const perms = rolePermissions(currentRole);

  const onlyInvoices = invoices.filter((i) => i.kind === "invoice");
  const totalSales = onlyInvoices.reduce((s, i) => {
    const cust = customers.find((c) => c.id === i.customerId);
    return s + computeTotals(i.items, cust?.state, business.state).grand;
  }, 0);
  const active = onlyInvoices.filter((i) => i.status !== "Paid").length;
  const pending = onlyInvoices.reduce((s, i) => {
    const cust = customers.find((c) => c.id === i.customerId);
    const grand = computeTotals(i.items, cust?.state, business.state).grand;
    return s + Math.max(0, grand - invoicePaid(i));
  }, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title={`Welcome back, ${business.name.split(" ")[0]} 👋`}
          subtitle="Here's how your shop is performing this fiscal year."
          actions={
            perms.canCreate && (
              <Link to="/invoices/new"><Button className="gap-1.5"><Plus className="w-4 h-4" /> New Invoice</Button></Link>
            )
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard label="Total Sales" value={inr(totalSales)} delta="+12.4%" up icon={IndianRupee} accent="primary" hidden={!perms.canViewFinancials} />
          <MetricCard label="Active Invoices" value={String(active)} delta={`${onlyInvoices.length} total`} icon={FileText} accent="info" />
          <MetricCard label="Pending Receivables" value={inr(pending)} delta="3 overdue" icon={AlertCircle} accent="warning" />
          <MetricCard label="Net Profit" value={inr(netProfit)} delta={netProfit >= 0 ? "+8.1%" : "-3.2%"} up={netProfit >= 0} icon={Wallet} accent="success" hidden={!perms.canViewFinancials} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-card border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-semibold">Recent Invoices</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest billing activity across staff.</p>
              </div>
              <Link to="/invoices" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium py-3 px-5">Invoice</th>
                    <th className="text-left font-medium py-3 px-2">Customer</th>
                    <th className="text-left font-medium py-3 px-2 hidden md:table-cell">Date</th>
                    <th className="text-right font-medium py-3 px-2">Amount</th>
                    <th className="text-left font-medium py-3 px-2">Status</th>
                    <th className="py-3 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {onlyInvoices.slice(0, 6).map((i) => {
                    const cust = customers.find((c) => c.id === i.customerId);
                    const t = computeTotals(i.items, cust?.state, business.state);
                    return (
                      <tr key={i.id} className="border-t hover:bg-muted/30">
                        <td className="py-3 px-5 font-medium font-mono text-xs">{i.number}</td>
                        <td className="py-3 px-2">{cust?.name}</td>
                        <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{fmtDate(i.date)}</td>
                        <td className="py-3 px-2 text-right font-medium">{inr(t.grand)}</td>
                        <td className="py-3 px-2"><StatusBadge status={i.status} /></td>
                        <td className="py-3 px-5 text-right">
                          <Link to="/invoices/$id" params={{ id: i.id }} className="text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold">Top Customers</h3>
              <div className="mt-4 space-y-3">
                {customers.slice(0, 4).map((c) => {
                  const ltv = onlyInvoices.filter((i) => i.customerId === c.id).reduce((s, i) => s + computeTotals(i.items, c.state, business.state).grand, 0);
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{c.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.state.split(" - ")[0]}</div>
                      </div>
                      <div className="text-sm font-semibold">{inr(ltv)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-xl p-5">
              <div className="text-xs uppercase tracking-wide opacity-80">This Month</div>
              <div className="text-3xl font-semibold mt-2">{inr(totalSales * 0.18)}</div>
              <div className="text-sm opacity-90 mt-1">GST collected (CGST + SGST + IGST)</div>
              <button className="mt-4 inline-flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-md px-3 h-8">
                Download GSTR-1 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  label, value, delta, up, icon: Icon, accent, hidden,
}: {
  label: string; value: string; delta?: string; up?: boolean; icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "info" | "warning" | "success"; hidden?: boolean;
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/20 text-warning-foreground",
    success: "bg-success/10 text-success",
  };
  return (
    <div className="bg-card border rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", accentMap[accent])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-xl md:text-2xl font-semibold tracking-tight">
        {hidden ? <span className="text-muted-foreground">••••••</span> : value}
      </div>
      {delta && !hidden && (
        <div className={cn("mt-1 text-xs inline-flex items-center gap-1", up === undefined ? "text-muted-foreground" : up ? "text-success" : "text-destructive")}>
          {up === true && <TrendingUp className="w-3 h-3" />}
          {up === false && <TrendingDown className="w-3 h-3" />}
          {delta}
        </div>
      )}
      {hidden && <div className="mt-1 text-xs text-muted-foreground">Hidden for {/* role */}Staff</div>}
    </div>
  );
}

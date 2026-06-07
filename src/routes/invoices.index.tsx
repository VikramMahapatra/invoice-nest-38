import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, FileText, Search, Filter, Eye } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, StatusBadge, EmptyState } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, invoicePaid, useStore, type InvoiceStatus } from "@/lib/store";
import { inr, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices/")({
  head: () => ({ meta: [{ title: "Invoices · BillKhata" }] }),
  component: InvoiceList,
});

function InvoiceList() {
  const { invoices, customers, business } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | InvoiceStatus>("All");

  const list = invoices.filter((i) => i.kind === "invoice");
  const tabs: ("All" | InvoiceStatus)[] = ["All", "Draft", "Sent", "Partially Paid", "Paid", "Overdue"];
  const counts = Object.fromEntries(tabs.map((t) => [t, t === "All" ? list.length : list.filter((i) => i.status === t).length])) as Record<string, number>;

  const filtered = list
    .filter((i) => tab === "All" || i.status === tab)
    .filter((i) => {
      const c = customers.find((x) => x.id === i.customerId);
      return !q || i.number.toLowerCase().includes(q.toLowerCase()) || c?.name.toLowerCase().includes(q.toLowerCase());
    });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="Invoices"
          subtitle="All tax invoices issued by Sharma Traders."
          actions={<Link to="/invoices/new"><Button className="gap-1.5"><Plus className="w-4 h-4" /> New Invoice</Button></Link>}
        />

        <div className="flex flex-wrap gap-1 border-b mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("px-4 h-10 text-sm font-medium border-b-2 -mb-px transition-colors", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {t} <span className="ml-1 text-xs text-muted-foreground">{counts[t]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice no. or customer…" className="w-full h-9 pl-9 pr-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Filter className="w-3.5 h-3.5" /> Filters</Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Create your first GST tax invoice in under 30 seconds." action={<Link to="/invoices/new"><Button>Create Invoice</Button></Link>} />
        ) : (
          <>
            <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium py-3 px-5">Invoice</th>
                    <th className="text-left font-medium py-3 px-2">Customer</th>
                    <th className="text-left font-medium py-3 px-2">Date</th>
                    <th className="text-left font-medium py-3 px-2">Due</th>
                    <th className="text-right font-medium py-3 px-2">Amount</th>
                    <th className="text-right font-medium py-3 px-2">Paid</th>
                    <th className="text-left font-medium py-3 px-2">Status</th>
                    <th className="py-3 px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const c = customers.find((x) => x.id === i.customerId);
                    const t = computeTotals(i.items, c?.state, business.state);
                    const paid = invoicePaid(i);
                    return (
                      <tr key={i.id} className="border-t hover:bg-muted/30">
                        <td className="py-3 px-5 font-mono text-xs font-medium">{i.number}</td>
                        <td className="py-3 px-2">{c?.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{fmtDate(i.date)}</td>
                        <td className="py-3 px-2 text-muted-foreground">{fmtDate(i.dueDate)}</td>
                        <td className="py-3 px-2 text-right font-medium">{inr(t.grand)}</td>
                        <td className="py-3 px-2 text-right text-muted-foreground">{inr(paid)}</td>
                        <td className="py-3 px-2"><StatusBadge status={i.status} /></td>
                        <td className="py-3 px-5 text-right">
                          <Link to="/invoices/$id" params={{ id: i.id }} className="text-primary hover:underline text-sm inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((i) => {
                const c = customers.find((x) => x.id === i.customerId);
                const t = computeTotals(i.items, c?.state, business.state);
                return (
                  <Link to="/invoices/$id" params={{ id: i.id }} key={i.id} className="block bg-card border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{i.number}</div>
                        <div className="font-medium mt-0.5">{c?.name}</div>
                      </div>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      <div className="text-xs text-muted-foreground">Due {fmtDate(i.dueDate)}</div>
                      <div className="font-semibold">{inr(t.grand)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

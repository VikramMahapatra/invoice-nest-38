import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Mail, Phone, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, EmptyState } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, invoicePaid, useStore } from "@/lib/store";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · BillKhata" }] }),
  component: Customers,
});

function Customers() {
  const { customers, invoices, business } = useStore();
  const [q, setQ] = useState("");

  const enriched = customers.map((c) => {
    const invs = invoices.filter((i) => i.customerId === c.id && i.kind === "invoice");
    const ltv = invs.reduce((s, i) => s + computeTotals(i.items, c.state, business.state).grand, 0);
    const overdue = invs.filter((i) => i.status === "Overdue").reduce((s, i) => s + (computeTotals(i.items, c.state, business.state).grand - invoicePaid(i)), 0);
    return { ...c, ltv, overdue, count: invs.length };
  });

  const filtered = enriched.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.gstin?.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Customers" subtitle="Track lifetime value and outstanding balances per customer." actions={<Button className="gap-1.5"><Plus className="w-4 h-4" /> Add Customer</Button>} />
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or GSTIN…" className="w-full h-9 pl-9 pr-3 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" description="Try adjusting your search or add a new customer." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    {c.gstin && <div className="text-xs font-mono text-muted-foreground">{c.gstin}</div>}
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {c.state.split(" - ")[0]}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Lifetime Value</div>
                    <div className="font-semibold mt-0.5">{inr(c.ltv)}</div>
                  </div>
                  <div className={cn("rounded-lg p-3", c.overdue > 0 ? "bg-destructive/10" : "bg-muted/50")}>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                    <div className={cn("font-semibold mt-0.5", c.overdue > 0 && "text-destructive")}>{c.overdue > 0 ? inr(c.overdue) : "—"}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                  <span>{c.count} invoice{c.count !== 1 ? "s" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

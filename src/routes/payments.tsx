import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Wallet } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, StatusBadge } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, invoicePaid, useStore } from "@/lib/store";
import { inr, fmtDate, daysBetween, today } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments & Ageing · BillKhata" }] }),
  component: Payments,
});

function Payments() {
  const { invoices, customers, business } = useStore();
  const [tab, setTab] = useState<"outstanding" | "ageing">("outstanding");

  const outstanding = invoices.filter((i) => i.kind === "invoice" && i.status !== "Paid" && i.status !== "Draft").map((i) => {
    const c = customers.find((x) => x.id === i.customerId)!;
    const t = computeTotals(i.items, c.state, business.state);
    const paid = invoicePaid(i);
    const due = t.grand - paid;
    const overdueDays = Math.max(0, daysBetween(i.dueDate, today()));
    return { inv: i, c, balance: due, overdueDays };
  });

  const buckets = {
    "0–30 days": outstanding.filter((x) => x.overdueDays <= 30),
    "30–60 days": outstanding.filter((x) => x.overdueDays > 30 && x.overdueDays <= 60),
    "60+ days": outstanding.filter((x) => x.overdueDays > 60),
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Payments" subtitle="Track receivables, record payments, and chase overdue invoices." />

        <div className="flex gap-1 border-b mb-6">
          {(["outstanding", "ageing"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-4 h-10 text-sm font-medium border-b-2 -mb-px capitalize", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t === "outstanding" ? "Outstanding" : "Ageing Report"}
            </button>
          ))}
        </div>

        {tab === "outstanding" ? (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">Invoice</th>
                  <th className="text-left py-3 px-2 font-medium">Customer</th>
                  <th className="text-left py-3 px-2 font-medium">Due Date</th>
                  <th className="text-right py-3 px-2 font-medium">Balance</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map(({ inv, c, balance, overdueDays }) => (
                  <tr key={inv.id} className={cn("border-t", overdueDays > 0 && "bg-destructive/[0.03]")}>
                    <td className="py-3 px-5 font-mono text-xs font-medium">{inv.number}</td>
                    <td className="py-3 px-2">{c.name}</td>
                    <td className="py-3 px-2">
                      {fmtDate(inv.dueDate)}
                      {overdueDays > 0 && <div className="text-xs text-destructive font-medium">{overdueDays}d overdue</div>}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">{inr(balance)}</td>
                    <td className="py-3 px-2"><StatusBadge status={inv.status} /></td>
                    <td className="py-3 px-5 text-right flex justify-end gap-1">
                      {overdueDays > 0 && (
                        <Button size="sm" variant="outline" className="gap-1 text-success border-success/30 hover:bg-success/10"><MessageCircle className="w-3.5 h-3.5" /> Nudge</Button>
                      )}
                      <Link to="/invoices/$id" params={{ id: inv.id }}><Button size="sm" className="gap-1"><Wallet className="w-3.5 h-3.5" /> Record</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(buckets).map(([label, list]) => {
              const total = list.reduce((s, x) => s + x.balance, 0);
              const colors = label === "0–30 days" ? "border-info/30 bg-info/5" : label === "30–60 days" ? "border-warning/40 bg-warning/10" : "border-destructive/30 bg-destructive/5";
              return (
                <div key={label} className={cn("rounded-xl border-2 p-5", colors)}>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-2xl font-semibold mt-1.5">{inr(total)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{list.length} invoice{list.length !== 1 ? "s" : ""}</div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {list.slice(0, 4).map((x) => (
                      <li key={x.inv.id} className="flex justify-between border-t pt-2 first:border-t-0 first:pt-0">
                        <div>
                          <div className="font-medium">{x.c.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{x.inv.number}</div>
                        </div>
                        <div className="font-medium">{inr(x.balance)}</div>
                      </li>
                    ))}
                    {list.length === 0 && <li className="text-xs text-muted-foreground text-center py-3">All clear</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

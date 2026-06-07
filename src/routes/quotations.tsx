import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, Plus, ArrowRight } from "lucide-react";
import { AppLayout, PageHeader, EmptyState, StatusBadge } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore } from "@/lib/store";
import { fmtDate, inr } from "@/lib/format";

export const Route = createFileRoute("/quotations")({
  head: () => ({ meta: [{ title: "Quotations · BillKhata" }] }),
  component: Quotations,
});

function Quotations() {
  const { invoices, customers, business, addInvoice } = useStore();
  const quotes = invoices.filter((i) => i.kind === "quotation");

  const createSample = () => {
    const c = customers[0];
    addInvoice({
      kind: "quotation",
      customerId: c.id,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      items: [{ name: "Site visit + Wiring estimate", hsn: "9954", qty: 1, unit: "Lot", price: 18500, gst: 18 }],
    });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Quotations & Proforma" subtitle="Send pre-order pricing approvals. Convert to tax invoices in one click." actions={<Button onClick={createSample} className="gap-1.5"><Plus className="w-4 h-4" /> New Quotation</Button>} />
        {quotes.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No quotations yet" description="Send a professional proforma invoice before closing a deal. Convert to a tax invoice when the customer confirms." action={<Button onClick={createSample}>Create Sample Quotation</Button>} />
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">Quote #</th>
                  <th className="text-left py-3 px-2 font-medium">Customer</th>
                  <th className="text-left py-3 px-2 font-medium">Date</th>
                  <th className="text-right py-3 px-2 font-medium">Amount</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const c = customers.find((x) => x.id === q.customerId);
                  const t = computeTotals(q.items, c?.state, business.state);
                  return (
                    <tr key={q.id} className="border-t">
                      <td className="py-3 px-5 font-mono text-xs">{q.number}</td>
                      <td className="py-3 px-2">{c?.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{fmtDate(q.date)}</td>
                      <td className="py-3 px-2 text-right font-medium">{inr(t.grand)}</td>
                      <td className="py-3 px-2"><StatusBadge status={q.status} /></td>
                      <td className="py-3 px-5 text-right">
                        <Link to="/invoices/$id" params={{ id: q.id }}><Button size="sm" variant="outline" className="gap-1">Convert <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

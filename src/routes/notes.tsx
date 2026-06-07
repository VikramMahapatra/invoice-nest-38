import { createFileRoute } from "@tanstack/react-router";
import { StickyNote, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader, EmptyState } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore, type InvoiceKind } from "@/lib/store";
import { fmtDate, inr, today } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Credit & Debit Notes · BillKhata" }] }),
  component: Notes,
});

const REASONS = ["Goods Returned", "Discount Adjusted", "Price Correction", "Quantity Mismatch", "Under-billing Correction", "Tax Rate Correction"];

function Notes() {
  const { invoices, customers, business, addInvoice } = useStore();
  const [tab, setTab] = useState<"credit_note" | "debit_note">("credit_note");
  const [open, setOpen] = useState(false);
  const notes = invoices.filter((i) => i.kind === tab);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Credit & Debit Notes" subtitle="Post-sale adjustments compliant with GST regulations." actions={<Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> New Note</Button>} />

        <div className="flex gap-1 border-b mb-6">
          {(["credit_note", "debit_note"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-4 h-10 text-sm font-medium border-b-2 -mb-px", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t === "credit_note" ? "Credit Notes" : "Debit Notes"}
            </button>
          ))}
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title={`No ${tab === "credit_note" ? "credit" : "debit"} notes yet`}
            description={tab === "credit_note" ? "Issue credit notes for returns, discounts, or over-billing." : "Issue debit notes for under-billing or additional charges."}
            action={<Button onClick={() => setOpen(true)}>Create Note</Button>}
          />
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">Note #</th>
                  <th className="text-left py-3 px-2 font-medium">Against Invoice</th>
                  <th className="text-left py-3 px-2 font-medium">Customer</th>
                  <th className="text-left py-3 px-2 font-medium">Reason</th>
                  <th className="text-left py-3 px-2 font-medium">Date</th>
                  <th className="text-right py-3 px-2 font-medium">Amount</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => {
                  const c = customers.find((x) => x.id === n.customerId);
                  const t = computeTotals(n.items, c?.state, business.state);
                  return (
                    <tr key={n.id} className="border-t">
                      <td className="py-3 px-5 font-mono text-xs">{n.number}</td>
                      <td className="py-3 px-2 font-mono text-xs">{n.refInvoice}</td>
                      <td className="py-3 px-2">{c?.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{n.notes}</td>
                      <td className="py-3 px-2 text-muted-foreground">{fmtDate(n.date)}</td>
                      <td className="py-3 px-2 text-right font-medium">{inr(t.grand)}</td>
                      <td className="py-3 px-5"><span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30"><ShieldCheck className="w-3 h-3" /> GSTR-1 Ready</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {open && <NoteModal kind={tab} onClose={() => setOpen(false)} onCreate={(payload) => { addInvoice(payload); setOpen(false); }} />}
      </div>
    </AppLayout>
  );
}

function NoteModal({ kind, onClose, onCreate }: { kind: InvoiceKind; onClose: () => void; onCreate: (p: any) => void }) {
  const { invoices, customers } = useStore();
  const realInvs = invoices.filter((i) => i.kind === "invoice");
  const [refId, setRefId] = useState(realInvs[0]?.id ?? "");
  const [reason, setReason] = useState(REASONS[0]);
  const [amount, setAmount] = useState(1000);
  const [gst, setGst] = useState(18);

  const ref = realInvs.find((x) => x.id === refId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">New {kind === "credit_note" ? "Credit" : "Debit"} Note</h3>
        <p className="text-xs text-muted-foreground mt-1">Linked to an existing tax invoice for GST compliance.</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Against Original Invoice *</label>
            <select value={refId} onChange={(e) => setRefId(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm">
              {realInvs.map((i) => {
                const c = customers.find((x) => x.id === i.customerId);
                return <option key={i.id} value={i.id}>{i.number} — {c?.name}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Adjustment Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm">
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Adjustment Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GST %</label>
              <select value={gst} onChange={(e) => setGst(+e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm">
                {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
          </div>
          <div className="text-xs flex items-center gap-1 text-success"><ShieldCheck className="w-3.5 h-3.5" /> Ready for GSTR-1 Upload</div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate({
            kind, customerId: ref?.customerId, refInvoice: ref?.number,
            date: today(), dueDate: today(), notes: reason,
            items: [{ name: `${reason} (vs ${ref?.number})`, hsn: "—", qty: 1, unit: "Lot", price: amount, gst }],
          })}>Create {kind === "credit_note" ? "Credit" : "Debit"} Note</Button>
        </div>
      </div>
    </div>
  );
}

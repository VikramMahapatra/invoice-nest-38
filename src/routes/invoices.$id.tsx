import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer, Share2, MessageCircle, Mail, Wallet, FileCheck2, Loader2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout, StatusBadge } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, invoicePaid, useStore } from "@/lib/store";
import { inr, inr2, fmtDate, today } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QrMock } from "@/components/ComplianceVisuals";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice · BillKhata" }] }),
  component: InvoiceView,
});

function InvoiceView() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { invoices, customers, business, recordPayment, updateInvoice, registerEInvoice } = useStore();
  const inv = invoices.find((x) => x.id === id);
  const [payOpen, setPayOpen] = useState(false);
  const [theme, setTheme] = useState<"classic" | "modern">("modern");
  const [registering, setRegistering] = useState(false);

  if (!inv) {
    return (
      <AppLayout>
        <div className="p-10 text-center text-muted-foreground">Invoice not found. <Link className="text-primary underline" to="/invoices">Go back</Link></div>
      </AppLayout>
    );
  }

  const customer = customers.find((c) => c.id === inv.customerId)!;
  const totals = useMemo(() => computeTotals(inv.items, customer?.state, business.state), [inv.items, customer, business.state]);
  const paid = invoicePaid(inv);
  const balance = Math.max(0, totals.grand - paid);
  const isQuotation = inv.kind === "quotation";
  const isNote = inv.kind === "credit_note" || inv.kind === "debit_note";

  const documentLabel = isQuotation ? "Proforma Invoice / Quotation" : inv.kind === "credit_note" ? "Credit Note" : inv.kind === "debit_note" ? "Debit Note" : "Tax Invoice";
  const locked = !!inv.eInvoice;
  const isTaxInvoice = inv.kind === "invoice";

  const registerIRP = () => {
    setRegistering(true);
    setTimeout(() => {
      const e = registerEInvoice(inv.id);
      setRegistering(false);
      toast.success("e-Invoice registered with IRP", { description: `IRN ${e.irn.slice(0, 8)}…${e.irn.slice(-4)}` });
    }, 1600);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => nav({ to: "/invoices" })} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to Invoices</button>
          <div className="flex items-center gap-2">
            {isQuotation && (
              <Button onClick={() => { updateInvoice(inv.id, { kind: "invoice", number: inv.number.replace("QT", "ST"), status: "Draft" }); }} className="gap-1.5">
                Convert to Tax Invoice
              </Button>
            )}
            {!isQuotation && !isNote && (
              <Button onClick={() => setPayOpen(true)} className="gap-1.5"><Wallet className="w-4 h-4" /> Record Payment</Button>
            )}
            {isTaxInvoice && !inv.eInvoice && (
              <Button variant="secondary" onClick={registerIRP} disabled={registering} className="gap-1.5">
                {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                {registering ? "Authenticating with IRP…" : "Register e-Invoice on IRP"}
              </Button>
            )}
            {isTaxInvoice && (
              <Link to="/eway"><Button variant="outline" size="sm" className="gap-1.5"><Truck className="w-3.5 h-3.5" /> E-Way Bill</Button></Link>
            )}
            <Button variant="outline" size="sm" className="gap-1.5"><Printer className="w-3.5 h-3.5" /> Print</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" /> PDF</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Share</Button>
          </div>
        </div>

        {registering && (
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border rounded-xl p-8 shadow-xl flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div>
                <div className="font-semibold">Authenticating with Invoice Registration Portal…</div>
                <div className="text-xs text-muted-foreground mt-0.5">Signing payload &amp; requesting IRN from NIC IRP</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-4">
            <div className="bg-card border rounded-xl p-5">
              <div className="text-xs text-muted-foreground">Document</div>
              <div className="font-mono font-semibold mt-1">{inv.number}</div>
              <div className="mt-3"><StatusBadge status={inv.status} /></div>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Issue Date</dt><dd>{fmtDate(inv.date)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Due Date</dt><dd>{fmtDate(inv.dueDate)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{inr(totals.grand)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd className="text-success">{inr(paid)}</dd></div>
                <div className="flex justify-between border-t pt-2.5"><dt className="font-medium">Balance Due</dt><dd className={cn("font-semibold", balance > 0 ? "text-destructive" : "text-success")}>{inr(balance)}</dd></div>
              </dl>

              <div className="mt-5 pt-5 border-t text-xs text-muted-foreground">Created by {inv.createdBy}</div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <h4 className="text-sm font-semibold">Template</h4>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {(["modern", "classic"] as const).map((t) => (
                  <button key={t} onClick={() => setTheme(t)} className={cn("p-3 border rounded-md text-xs capitalize", theme === t ? "border-primary bg-primary/5 text-primary font-medium" : "")}>{t}</button>
                ))}
              </div>
            </div>

            {inv.status === "Overdue" && (
              <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-5">
                <div className="text-sm font-semibold text-destructive">Overdue Reminder</div>
                <p className="text-xs text-muted-foreground mt-1">Send a polite WhatsApp nudge with pre-filled template.</p>
                <Button size="sm" className="mt-3 w-full gap-1.5 bg-success text-success-foreground hover:bg-success/90"><MessageCircle className="w-4 h-4" /> Send WhatsApp Nudge</Button>
                <Button size="sm" variant="outline" className="mt-2 w-full gap-1.5"><Mail className="w-4 h-4" /> Email Reminder</Button>
              </div>
            )}

            {inv.payments.length > 0 && (
              <div className="bg-card border rounded-xl p-5">
                <h4 className="text-sm font-semibold">Payment History</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {inv.payments.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span className="text-muted-foreground">{fmtDate(p.date)} · {p.mode}</span>
                      <span className="font-medium">{inr(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <div>
            <div className="bg-white shadow-sm border rounded-xl p-8 md:p-12 relative overflow-hidden text-zinc-900">
              {isQuotation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-zinc-200/80 text-7xl font-black tracking-widest rotate-[-25deg] whitespace-nowrap">PROFORMA · QUOTATION</span>
                </div>
              )}
              <div className="relative">
                <div className="flex justify-between items-start gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">{documentLabel}</div>
                    <div className="text-3xl font-bold mt-1">{business.name}</div>
                    <div className="text-sm text-zinc-600 mt-1 max-w-xs">{business.address}</div>
                    <div className="text-sm text-zinc-600">Ph: {business.phone} · {business.email}</div>
                    <div className="mt-2 inline-block bg-zinc-100 px-2 py-1 rounded text-xs font-mono">GSTIN: {business.gstin}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Invoice #</div>
                    <div className="font-mono font-semibold">{inv.number}</div>
                    <div className="mt-3 text-xs text-zinc-500">Date</div>
                    <div className="text-sm font-medium">{fmtDate(inv.date)}</div>
                    {!isQuotation && <><div className="mt-3 text-xs text-zinc-500">Due</div><div className="text-sm font-medium">{fmtDate(inv.dueDate)}</div></>}
                    {isNote && inv.refInvoice && <><div className="mt-3 text-xs text-zinc-500">Against Invoice</div><div className="text-sm font-mono font-medium">{inv.refInvoice}</div></>}
                    {inv.eInvoice && (
                      <div className="mt-3 flex justify-end">
                        <QrMock value={inv.eInvoice.irn} size={104} className="border border-zinc-200 rounded" />
                      </div>
                    )}
                  </div>
                </div>

                {inv.eInvoice && (
                  <div className="mt-6 p-3 border border-zinc-200 rounded bg-zinc-50 text-xs">
                    <div className="font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-1">e-Invoice Authentication Details</div>
                    <div className="grid sm:grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono">
                      <span className="text-zinc-500">IRN</span><span className="break-all">{inv.eInvoice.irn}</span>
                      <span className="text-zinc-500">Ack No</span><span>{inv.eInvoice.ackNo}</span>
                      <span className="text-zinc-500">Ack Date</span><span>{inv.eInvoice.ackDate}</span>
                    </div>
                  </div>
                )}

                {inv.eWayBill && (
                  <div className="mt-3 p-3 border border-zinc-200 rounded bg-zinc-50 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-700 uppercase tracking-wider text-[10px] mb-0.5">E-Way Bill</div>
                      <div className="font-mono">EBN {inv.eWayBill.number} · {inv.eWayBill.mode} · {inv.eWayBill.vehicle}</div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6 mt-8 pt-6 border-t">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Bill To</div>
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-zinc-600">{customer.address}</div>
                    {customer.gstin && <div className="text-xs font-mono mt-1">GSTIN: {customer.gstin}</div>}
                    <div className="text-xs text-zinc-600 mt-0.5">{customer.state}</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Place of Supply</div>
                    <div className="font-semibold">{customer.state}</div>
                    <div className="text-xs text-zinc-600 mt-1">
                      {totals.interstate ? "Interstate Supply (IGST applicable)" : "Intrastate Supply (CGST + SGST)"}
                    </div>
                  </div>
                </div>

                <table className="w-full mt-8 text-sm">
                  <thead className="bg-zinc-900 text-white">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium">Item</th>
                      <th className="text-left px-2 py-2.5 font-medium">HSN</th>
                      <th className="text-right px-2 py-2.5 font-medium">Qty</th>
                      <th className="text-right px-2 py-2.5 font-medium">Rate</th>
                      <th className="text-right px-2 py-2.5 font-medium">GST%</th>
                      <th className="text-right px-3 py-2.5 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((it, i) => (
                      <tr key={i} className="border-b border-zinc-100">
                        <td className="px-3 py-3">{it.name}</td>
                        <td className="px-2 py-3 font-mono text-xs">{it.hsn}</td>
                        <td className="px-2 py-3 text-right">{it.qty} {it.unit}</td>
                        <td className="px-2 py-3 text-right">{inr2(it.price)}</td>
                        <td className="px-2 py-3 text-right">{it.gst}%</td>
                        <td className="px-3 py-3 text-right font-medium">{inr2(it.qty * it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Bank Details</div>
                    <div className="text-sm space-y-0.5">
                      <div><span className="text-zinc-500">Bank:</span> {business.bank.name}</div>
                      <div><span className="text-zinc-500">A/C:</span> <span className="font-mono">{business.bank.account}</span></div>
                      <div><span className="text-zinc-500">IFSC:</span> <span className="font-mono">{business.bank.ifsc}</span></div>
                      <div><span className="text-zinc-500">Branch:</span> {business.bank.branch}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between py-1"><span className="text-zinc-600">Subtotal</span><span>{inr2(totals.subtotal)}</span></div>
                    {totals.interstate ? (
                      <div className="flex justify-between py-1"><span className="text-zinc-600">IGST</span><span>{inr2(totals.igst)}</span></div>
                    ) : (
                      <>
                        <div className="flex justify-between py-1"><span className="text-zinc-600">CGST</span><span>{inr2(totals.cgst)}</span></div>
                        <div className="flex justify-between py-1"><span className="text-zinc-600">SGST</span><span>{inr2(totals.sgst)}</span></div>
                      </>
                    )}
                    <div className="flex justify-between py-1 text-zinc-500"><span>Round Off</span><span>{inr2(totals.roundOff)}</span></div>
                    <div className="flex justify-between py-2 border-t mt-1 font-bold text-base"><span>Grand Total</span><span>{inr(totals.grand)}</span></div>
                  </div>
                </div>

                <div className="mt-12 pt-8 grid grid-cols-2 gap-6 text-xs text-zinc-500">
                  <div>
                    <div className="font-semibold text-zinc-700 mb-1">Terms &amp; Conditions</div>
                    Payment due within 15 days. Interest @18% p.a. on overdue amounts.
                    Goods once sold will not be taken back. Subject to Pune jurisdiction.
                  </div>
                  <div className="text-right">
                    <div className="h-12 border-b border-zinc-300 mb-2 inline-block w-40" />
                    <div className="font-semibold text-zinc-700">Authorized Signatory</div>
                    <div>for {business.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {payOpen && <PaymentPanel onClose={() => setPayOpen(false)} balance={balance} onSave={(p) => { recordPayment(inv.id, p); setPayOpen(false); }} />}
      </div>
    </AppLayout>
  );
}

function PaymentPanel({ onClose, balance, onSave }: { onClose: () => void; balance: number; onSave: (p: { date: string; amount: number; mode: "UPI" | "Cash" | "NEFT" | "IMPS" }) => void }) {
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState(balance);
  const [mode, setMode] = useState<"UPI" | "Cash" | "NEFT" | "IMPS">("UPI");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-card h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Record Payment</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground">Outstanding Balance</div>
            <div className="text-2xl font-semibold mt-1">{inr(balance)}</div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount Received</label>
            <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" />
            <div className="mt-1.5 flex gap-1.5 text-xs">
              <button onClick={() => setAmount(balance)} className="px-2 py-1 rounded bg-muted hover:bg-accent">Full</button>
              <button onClick={() => setAmount(Math.round(balance / 2))} className="px-2 py-1 rounded bg-muted hover:bg-accent">Half</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment Mode</label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {(["UPI", "Cash", "NEFT", "IMPS"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("h-10 rounded-md border text-sm font-medium", mode === m ? "border-primary bg-primary/5 text-primary" : "")}>{m}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave({ date, amount, mode })} className="flex-1">Record {inr(amount)}</Button>
        </div>
      </div>
    </div>
  );
}

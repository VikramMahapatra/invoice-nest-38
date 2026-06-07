import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2, UserPlus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore, type LineItem } from "@/lib/store";
import { inr2, today, addDays } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "New Invoice · BillKhata" }] }),
  component: NewInvoice,
});

const GST_RATES = [0, 5, 12, 18, 28];

function NewInvoice() {
  const { customers, products, business, addInvoice, addCustomer, nextInvoiceNumber } = useStore();
  const nav = useNavigate();

  const [number] = useState(nextInvoiceNumber("invoice"));
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState(addDays(today(), 15));
  const [items, setItems] = useState<LineItem[]>([
    { name: products[0].name, hsn: products[0].hsn, qty: 1, unit: products[0].unit, price: products[0].price, gst: products[0].gst, productId: products[0].id },
  ]);
  const [openCustModal, setOpenCustModal] = useState(false);
  const [openProdPicker, setOpenProdPicker] = useState<number | null>(null);

  const customer = customers.find((c) => c.id === customerId);
  const totals = useMemo(() => computeTotals(items, customer?.state, business.state), [items, customer, business.state]);

  const updateItem = (idx: number, patch: Partial<LineItem>) =>
    setItems((x) => x.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((x) => [...x, { name: "", hsn: "", qty: 1, unit: "Pcs", price: 0, gst: 18 }]);
  const removeItem = (idx: number) => setItems((x) => x.filter((_, i) => i !== idx));

  const save = (draft: boolean) => {
    const inv = addInvoice({ customerId, date, dueDate, items, number });
    if (!draft) {
      // mark as sent
    }
    nav({ to: "/invoices/$id", params: { id: inv.id } });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="New Tax Invoice"
          subtitle={`Invoice no. ${number} · GSTIN ${business.gstin}`}
          actions={
            <>
              <Button variant="outline" onClick={() => save(true)}>Save as Draft</Button>
              <Button onClick={() => save(false)}>Save &amp; Preview</Button>
            </>
          }
        />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Bill To</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Customer</label>
                  <div className="flex gap-2 mt-1.5">
                    <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex-1 h-10 px-3 rounded-md border bg-card text-sm">
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button variant="outline" size="icon" onClick={() => setOpenCustModal(true)} title="Add new customer"><UserPlus className="w-4 h-4" /></Button>
                  </div>
                  {customer && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="font-mono">{customer.gstin ?? "Unregistered"}</div>
                      <div>{customer.address}</div>
                      <div className="mt-0.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border", totals.interstate ? "bg-warning/15 text-warning-foreground border-warning/40" : "bg-success/15 text-success border-success/30")}>
                          {totals.interstate ? "Interstate · IGST" : "Intrastate · CGST + SGST"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Invoice Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-md border bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-md border bg-card text-sm" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card border rounded-xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b">
                <h3 className="font-semibold">Line Items</h3>
                <Button size="sm" variant="outline" onClick={addItem} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-medium">Product</th>
                      <th className="text-left py-2.5 px-2 font-medium">HSN</th>
                      <th className="text-right py-2.5 px-2 font-medium">Qty</th>
                      <th className="text-left py-2.5 px-2 font-medium">Unit</th>
                      <th className="text-right py-2.5 px-2 font-medium">Price</th>
                      <th className="text-right py-2.5 px-2 font-medium">GST</th>
                      <th className="text-right py-2.5 px-4 font-medium">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-4 relative">
                          <input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} onFocus={() => setOpenProdPicker(idx)} className="w-full h-9 px-2 rounded border bg-background text-sm" placeholder="Product or service" />
                          {openProdPicker === idx && (
                            <div className="absolute z-20 top-12 left-4 w-72 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                              {products.map((p) => (
                                <button key={p.id} type="button" onClick={() => { updateItem(idx, { name: p.name, hsn: p.hsn, price: p.price, gst: p.gst, unit: p.unit, productId: p.id }); setOpenProdPicker(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-muted-foreground">HSN {p.hsn} · {inr2(p.price)} / {p.unit}</div>
                                </button>
                              ))}
                              <button type="button" onClick={() => setOpenProdPicker(null)} className="w-full text-left px-3 py-2 text-xs text-muted-foreground border-t">Close</button>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2"><input value={it.hsn} onChange={(e) => updateItem(idx, { hsn: e.target.value })} className="w-20 h-9 px-2 rounded border bg-background text-sm font-mono" /></td>
                        <td className="py-2 px-2"><input type="number" value={it.qty} onChange={(e) => updateItem(idx, { qty: +e.target.value })} className="w-20 h-9 px-2 rounded border bg-background text-sm text-right" /></td>
                        <td className="py-2 px-2"><input value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="w-16 h-9 px-2 rounded border bg-background text-sm" /></td>
                        <td className="py-2 px-2"><input type="number" value={it.price} onChange={(e) => updateItem(idx, { price: +e.target.value })} className="w-24 h-9 px-2 rounded border bg-background text-sm text-right" /></td>
                        <td className="py-2 px-2">
                          <select value={it.gst} onChange={(e) => updateItem(idx, { gst: +e.target.value })} className="w-20 h-9 px-2 rounded border bg-background text-sm">
                            {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-4 text-right font-medium">{inr2(it.qty * it.price * (1 + it.gst / 100))}</td>
                        <td className="py-2 pr-3"><button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="bg-card border rounded-xl p-5 sticky top-20">
              <h3 className="font-semibold">Summary</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={inr2(totals.subtotal)} />
                {totals.interstate ? (
                  <Row k="IGST" v={inr2(totals.igst)} />
                ) : (
                  <>
                    <Row k="CGST" v={inr2(totals.cgst)} />
                    <Row k="SGST" v={inr2(totals.sgst)} />
                  </>
                )}
                <Row k="Round Off" v={inr2(totals.roundOff)} muted />
                <div className="border-t pt-3 mt-2 flex justify-between items-baseline">
                  <span className="font-semibold">Grand Total</span>
                  <span className="text-2xl font-semibold tracking-tight">{inr2(totals.grand)}</span>
                </div>
              </dl>
              <div className="mt-5 space-y-2">
                <Button className="w-full" onClick={() => save(false)}>Save &amp; Preview</Button>
                <Button variant="outline" className="w-full" onClick={() => save(true)}>Save as Draft</Button>
              </div>
            </div>
          </aside>
        </div>

        {openCustModal && <CustomerModal onClose={() => setOpenCustModal(false)} onCreate={(c) => { const nc = addCustomer(c); setCustomerId(nc.id); setOpenCustModal(false); }} />}
      </div>
    </AppLayout>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between", muted && "text-muted-foreground")}>
      <dt>{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function CustomerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: { name: string; gstin?: string; phone: string; state: string; address: string }) => void }) {
  const [f, setF] = useState({ name: "", gstin: "", phone: "", state: "Maharashtra - 27", address: "" });
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add New Customer</h3>
        <div className="mt-4 space-y-3">
          {[
            ["Business Name", "name"],
            ["GSTIN (optional)", "gstin"],
            ["Phone", "phone"],
            ["Address", "address"],
          ].map(([l, k]) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground">{l}</label>
              <input value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm" />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground">State</label>
            <select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm">
              {["Maharashtra - 27", "Delhi - 07", "Gujarat - 24", "Karnataka - 29", "Tamil Nadu - 33"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(f)}>Add Customer</Button>
        </div>
      </div>
    </div>
  );
}

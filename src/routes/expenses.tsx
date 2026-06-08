import { createFileRoute } from "@tanstack/react-router";
import { Plus, Receipt, TrendingDown } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStore, type Expense } from "@/lib/store";
import { inr, fmtDate, today } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses · BillKhata" }] }),
  component: Expenses,
});

const CATEGORIES = ["Rent", "Electricity", "Stock Purchase", "Staff Salary", "Transport", "Other"] as const;

function Expenses() {
  const { expenses, addExpense } = useStore();
  const [open, setOpen] = useState(false);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const itc = expenses.filter((e) => e.gstEligible).reduce((s, e) => s + (e.gstAmount ?? 0), 0);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Expenses" subtitle="Capture spending to flow into your Net Profit metric." actions={<Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Record Expense</Button>} />

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-5">
            <div className="text-xs text-muted-foreground">Total Expenses (this period)</div>
            <div className="text-2xl font-semibold mt-1">{inr(total)}</div>
            <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Reduces Net Profit</div>
          </div>
          <div className="bg-card border rounded-xl p-5">
            <div className="text-xs text-muted-foreground">Input Tax Credit Available</div>
            <div className="text-2xl font-semibold mt-1 text-success">{inr(itc)}</div>
            <div className="text-xs text-muted-foreground mt-1">From GST-eligible purchases</div>
          </div>
          <div className="bg-card border rounded-xl p-5">
            <div className="text-xs text-muted-foreground">Records this Month</div>
            <div className="text-2xl font-semibold mt-1">{expenses.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Across {new Set(expenses.map((e) => e.category)).size} categories</div>
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-5 font-medium">Expense</th>
                <th className="text-left py-3 px-2 font-medium">Category</th>
                <th className="text-left py-3 px-2 font-medium">Vendor</th>
                <th className="text-left py-3 px-2 font-medium">Date</th>
                <th className="text-left py-3 px-2 font-medium">Type</th>
                <th className="text-right py-3 px-5 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t hover:bg-muted/30">
                  <td className="py-3 px-5 font-medium flex items-center gap-3"><div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Receipt className="w-4 h-4 text-muted-foreground" /></div>{e.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{e.category}</td>
                  <td className="py-3 px-2 text-muted-foreground">{e.vendor}</td>
                  <td className="py-3 px-2 text-muted-foreground">{fmtDate(e.date)}</td>
                  <td className="py-3 px-2"><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", e.gstEligible ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground")}>{e.gstEligible ? "GST · ITC" : "Non-GST"}</span></td>
                  <td className="py-3 px-5 text-right font-medium">{inr(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {open && <ExpenseForm onClose={() => setOpen(false)} onSave={(e) => { addExpense(e); setOpen(false); }} />}
      </div>
    </AppLayout>
  );
}

function ExpenseForm({ onClose, onSave }: { onClose: () => void; onSave: (e: Omit<Expense, "id">) => void }) {
  const { products } = useStore();
  const [f, setF] = useState({ name: "", category: "Rent" as Expense["category"], date: today(), amount: 0, vendor: "", gstEligible: false, gstAmount: 0, productId: products[0]?.id ?? "", qty: 0 });
  const isStock = f.category === "Stock Purchase";
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-card h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Record Expense</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Expense Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="ipt" /></Field>
          <Field label="Category">
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Expense["category"] })} className="ipt">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="ipt" /></Field>
            <Field label="Amount (₹)"><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} className="ipt" /></Field>
          </div>
          <Field label="Vendor / Payee"><input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className="ipt" /></Field>

          {isStock && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <div className="text-xs font-semibold text-primary">Inventory Restock</div>
              <Field label="Product">
                <select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} className="ipt">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
              </Field>
              <Field label="Quantity Received">
                <input type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })} className="ipt" />
              </Field>
              <p className="text-[11px] text-muted-foreground">Stock will increment by this quantity on save.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">GST Classification</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 p-1 bg-muted rounded-md">
              <button onClick={() => setF({ ...f, gstEligible: true })} className={cn("h-10 rounded-md text-sm font-medium", f.gstEligible ? "bg-card shadow-sm" : "text-muted-foreground")}>GST-Eligible (ITC)</button>
              <button onClick={() => setF({ ...f, gstEligible: false })} className={cn("h-10 rounded-md text-sm font-medium", !f.gstEligible ? "bg-card shadow-sm" : "text-muted-foreground")}>Non-GST</button>
            </div>
            {f.gstEligible && (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground">GST Amount (₹)</label>
                <input type="number" value={f.gstAmount} onChange={(e) => setF({ ...f, gstAmount: +e.target.value })} className="ipt mt-1" />
                <p className="text-xs text-success mt-1">This amount adds to your Input Tax Credit.</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave(isStock ? f : { ...f, productId: undefined, qty: undefined })} className="flex-1">Save Expense</Button>
        </div>
        <style>{`.ipt { width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.375rem; border: 1px solid var(--color-input); background: var(--color-background); font-size: 0.875rem; outline: none; } .ipt:focus { box-shadow: 0 0 0 2px var(--color-ring); }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><div className="mt-1.5">{children}</div></div>;
}

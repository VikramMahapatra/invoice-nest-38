import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Boxes, Plus, Minus, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStore, type StockAdjustment } from "@/lib/store";
import { inr, fmtDate, today } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory · BillKhata" }] }),
  component: Inventory,
});

const LOW = 15;

function Inventory() {
  const { products, stockAdjustments, adjustStock } = useStore();
  const [active, setActive] = useState<string | null>(null);

  const totals = useMemo(() => {
    const value = products.reduce((s, p) => s + p.stock * p.avgCost, 0);
    const lowCount = products.filter((p) => p.stock < LOW).length;
    const skus = products.length;
    return { value, lowCount, skus };
  }, [products]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Inventory & Stock Ledger" subtitle="Live stock balances, automatic depletion from invoices, and COGS-ready valuations." />

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Tile label="Total Asset Valuation" value={inr(totals.value)} hint="Σ (Qty × Avg Cost)" />
          <Tile label="Low-Stock SKUs" value={String(totals.lowCount)} hint={`Below ${LOW} units`} accent={totals.lowCount > 0 ? "destructive" : undefined} />
          <Tile label="Total SKUs Tracked" value={String(totals.skus)} hint="Across all categories" />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-5 font-medium">Product</th>
                <th className="text-left py-3 px-2 font-medium">SKU</th>
                <th className="text-left py-3 px-2 font-medium">HSN</th>
                <th className="text-right py-3 px-2 font-medium">On Hand</th>
                <th className="text-left py-3 px-2 font-medium">Unit</th>
                <th className="text-right py-3 px-2 font-medium">Avg Cost</th>
                <th className="text-right py-3 px-2 font-medium">Asset Value</th>
                <th className="text-right py-3 px-5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock < LOW;
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-5">
                      <div className="font-medium">{p.name}</div>
                      {low && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 border border-destructive/25 px-1.5 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Low Stock Alert</span>}
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{p.hsn}</td>
                    <td className={cn("py-3 px-2 text-right font-semibold tabular-nums", low && "text-destructive")}>{p.stock}</td>
                    <td className="py-3 px-2 text-muted-foreground">{p.unit}</td>
                    <td className="py-3 px-2 text-right">{inr(p.avgCost)}</td>
                    <td className="py-3 px-2 text-right font-medium">{inr(p.stock * p.avgCost)}</td>
                    <td className="py-3 px-5 text-right"><Button size="sm" variant="outline" onClick={() => setActive(p.id)}>Adjust</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {products.map((p) => {
            const low = p.stock < LOW;
            return (
              <div key={p.id} className="bg-card border rounded-xl p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.sku} · HSN {p.hsn}</div>
                  </div>
                  {low && <span className="text-[11px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/25">Low</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                  <div><div className="text-[11px] text-muted-foreground">On Hand</div><div className={cn("font-semibold", low && "text-destructive")}>{p.stock} {p.unit}</div></div>
                  <div><div className="text-[11px] text-muted-foreground">Avg Cost</div><div className="font-medium">{inr(p.avgCost)}</div></div>
                  <div><div className="text-[11px] text-muted-foreground">Value</div><div className="font-medium">{inr(p.stock * p.avgCost)}</div></div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setActive(p.id)}>Adjust Stock</Button>
              </div>
            );
          })}
        </div>

        <section className="mt-8 bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><History className="w-4 h-4 text-muted-foreground" /><h3 className="font-semibold">Recent Stock Movements</h3></div>
          {stockAdjustments.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No adjustments yet. Stock movements from invoices and procurement will appear here.</div>
          ) : (
            <ul className="divide-y">
              {stockAdjustments.slice(0, 8).map((a) => {
                const p = products.find((x) => x.id === a.productId);
                return (
                  <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{p?.name ?? a.productId}</div>
                      <div className="text-xs text-muted-foreground">{a.reason} · {fmtDate(a.date)}{a.note ? ` · ${a.note}` : ""}</div>
                    </div>
                    <div className={cn("font-semibold tabular-nums", a.delta >= 0 ? "text-success" : "text-destructive")}>
                      {a.delta >= 0 ? "+" : ""}{a.delta} {p?.unit}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {active && <AdjustPanel productId={active} onClose={() => setActive(null)} onSave={(a) => { adjustStock(a); toast.success("Stock adjusted"); setActive(null); }} />}
      </div>
    </AppLayout>
  );
}

function Tile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "destructive" }) {
  return (
    <div className={cn("bg-card border rounded-xl p-5", accent === "destructive" && "border-destructive/30 bg-destructive/5")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-semibold mt-1", accent === "destructive" && "text-destructive")}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function AdjustPanel({ productId, onClose, onSave }: { productId: string; onClose: () => void; onSave: (a: Omit<StockAdjustment, "id">) => void }) {
  const { products } = useStore();
  const product = products.find((p) => p.id === productId)!;
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState<StockAdjustment["reason"]>("Stock Audit Correction");
  const [note, setNote] = useState("");

  const reasons: StockAdjustment["reason"][] = ["Damaged Goods", "Stock Audit Correction", "Theft/Loss", "Promotional Sample"];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-card h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Adjust Stock Balance</h3>
          <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-muted rounded-lg p-4 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Current On Hand</span>
            <span className="text-2xl font-semibold">{product.stock} <span className="text-sm text-muted-foreground">{product.unit}</span></span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Quantity Change</label>
            <div className="mt-2 flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setDelta((d) => d - 1)}><Minus className="w-4 h-4" /></Button>
              <input type="number" value={delta} onChange={(e) => setDelta(+e.target.value)} className="flex-1 h-11 px-3 text-center text-lg font-semibold rounded-md border bg-background" />
              <Button variant="outline" size="icon" onClick={() => setDelta((d) => d + 1)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">New balance: <span className="font-medium text-foreground">{Math.max(0, product.stock + delta)} {product.unit}</span></div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason for Adjustment <span className="text-destructive">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value as StockAdjustment["reason"])} className="mt-1.5 w-full h-10 px-3 rounded-md border bg-background text-sm">
              {reasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1.5 w-full px-3 py-2 rounded-md border bg-background text-sm" />
          </div>
        </div>
        <div className="p-6 border-t flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onSave({ productId, delta, reason, note, date: today() })} className="flex-1" disabled={delta === 0}>Save Adjustment</Button>
        </div>
      </div>
    </div>
  );
}

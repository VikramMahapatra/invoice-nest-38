import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, BookOpen, Package } from "lucide-react";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { inr2 } from "@/lib/format";

const HSN_DB = [
  { code: "8544", desc: "Insulated wire & cable", gst: 18 },
  { code: "8536", desc: "Electrical switches, relays, MCB", gst: 18 },
  { code: "8539", desc: "Electric lamps & LED bulbs", gst: 12 },
  { code: "8414", desc: "Fans, blowers, ventilation", gst: 18 },
  { code: "3917", desc: "Plastic tubes, pipes, conduit", gst: 18 },
  { code: "8504", desc: "Transformers, inverters, UPS", gst: 18 },
];

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products · BillKhata" }] }),
  component: Products,
});

function Products() {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const [hsnOpen, setHsnOpen] = useState(false);
  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Product Catalogue" subtitle="Manage your inventory with HSN codes and default GST rates." actions={
          <>
            <Button variant="outline" onClick={() => setHsnOpen(true)} className="gap-1.5"><BookOpen className="w-4 h-4" /> HSN Lookup</Button>
            <Button className="gap-1.5"><Plus className="w-4 h-4" /> Add Product</Button>
          </>
        } />

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" className="w-full h-9 pl-9 pr-3 rounded-md border bg-card text-sm" />
          </div>
        </div>

        <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-5 font-medium">Product</th>
                <th className="text-left py-3 px-2 font-medium">SKU</th>
                <th className="text-left py-3 px-2 font-medium">HSN</th>
                <th className="text-right py-3 px-2 font-medium">Unit Price</th>
                <th className="text-center py-3 px-2 font-medium">Unit</th>
                <th className="text-center py-3 px-5 font-medium">GST Rate</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="py-3 px-5 font-medium flex items-center gap-3"><div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>{p.name}</td>
                  <td className="py-3 px-2 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-2 font-mono text-xs">{p.hsn}</td>
                  <td className="py-3 px-2 text-right">{inr2(p.price)}</td>
                  <td className="py-3 px-2 text-center text-muted-foreground">{p.unit}</td>
                  <td className="py-3 px-5 text-center"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.gst}% GST</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {list.map((p) => (
            <div key={p.id} className="bg-card border rounded-lg p-4">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-3"><span>SKU: {p.sku}</span><span>HSN: {p.hsn}</span></div>
              <div className="mt-3 flex justify-between items-end">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.gst}% GST</span>
                <span className="font-semibold">{inr2(p.price)} / {p.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {hsnOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setHsnOpen(false)}>
            <div className="bg-card rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">HSN Code Lookup</h3>
              <p className="text-xs text-muted-foreground mt-1">Find the correct Harmonized System of Nomenclature code for any product.</p>
              <input placeholder="Search HSN code or product…" className="mt-4 w-full h-10 px-3 rounded-md border bg-background text-sm" />
              <div className="mt-3 border rounded-lg divide-y max-h-72 overflow-y-auto">
                {HSN_DB.map((h) => (
                  <div key={h.code} className="p-3 flex items-center justify-between hover:bg-muted">
                    <div>
                      <div className="font-mono text-sm font-semibold">{h.code}</div>
                      <div className="text-xs text-muted-foreground">{h.desc}</div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{h.gst}% GST</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end"><Button onClick={() => setHsnOpen(false)}>Close</Button></div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

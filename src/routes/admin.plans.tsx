import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminPageHeader } from "@/components/AdminLayout";
import { plans } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Plans · BillKhata Admin" }] }),
  component: PlansPage,
});

const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

function PlansPage() {
  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <AdminPageHeader
          title="Subscription plans"
          subtitle="Pricing tiers offered to tenants on the platform"
          actions={<Button className="gap-1.5"><Plus className="w-4 h-4" /> New plan</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-xl border bg-card p-5 relative ${p.popular ? "ring-2 ring-primary" : ""}`}>
              {p.popular && (
                <div className="absolute -top-2.5 left-5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" /> Most popular
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.tagline}</div>
                </div>
                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-semibold">{inr(p.price)}</span>
                <span className="text-sm text-muted-foreground">{p.billed}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active tenants</span>
                <span className="font-semibold">{p.tenants}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border bg-card p-5">
          <div className="text-sm font-semibold">Add-ons & overrides</div>
          <div className="text-xs text-muted-foreground mt-1">Configure usage-based pricing and enterprise overrides.</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {[
              { k: "Extra users", v: "₹99 / user / mo" },
              { k: "Extra storage", v: "₹49 / GB / mo" },
              { k: "E-Invoice IRN", v: "₹0.50 per IRN over 5k" },
            ].map((x) => (
              <div key={x.k} className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">{x.k}</div>
                <div className="font-medium mt-1">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

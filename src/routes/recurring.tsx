import { createFileRoute } from "@tanstack/react-router";
import { Repeat, MessageCircle, Calendar, Plus } from "lucide-react";
import { AppLayout, PageHeader, EmptyState } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { fmtDate, inr } from "@/lib/format";
import { computeTotals } from "@/lib/store";

export const Route = createFileRoute("/recurring")({
  head: () => ({ meta: [{ title: "Recurring Invoices · BillKhata" }] }),
  component: Recurring,
});

function Recurring() {
  const { recurring, customers, business } = useStore();
  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader title="Recurring Invoices" subtitle="Automate billing for AMCs, rent, and monthly contracts." actions={<Button className="gap-1.5"><Plus className="w-4 h-4" /> New Recurring Profile</Button>} />

        {recurring.length === 0 ? (
          <EmptyState icon={Repeat} title="No recurring profiles" description="Set up automated billing cycles for your repeat customers." action={<Button>Create Profile</Button>} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recurring.map((r) => {
              const c = customers.find((x) => x.id === r.customerId);
              const t = computeTotals(r.items, c?.state, business.state);
              return (
                <div key={r.id} className="bg-card border rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{c?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.items.length} item{r.items.length !== 1 ? "s" : ""} · {r.frequency}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"><Repeat className="w-3 h-3" /> {r.frequency}</span>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm flex-1">
                      <div className="font-medium">Next generation</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(r.nextDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-semibold">{inr(t.grand)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="w-4 h-4" /> Auto-Send WhatsApp</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={r.autoSendWhatsApp} className="sr-only peer" />
                      <div className="w-9 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                    <span>Started {fmtDate(r.startDate)}</span>
                    <span>{r.indefinite ? "Runs indefinitely" : "Ends " + fmtDate(r.endDate ?? "")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Truck, CheckCircle2, Printer, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader, EmptyState } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, generateEWayNumber, useStore, type EWayBill } from "@/lib/store";
import { inr, fmtDate, today } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarcodeMock } from "@/components/ComplianceVisuals";

export const Route = createFileRoute("/eway")({
  head: () => ({ meta: [{ title: "E-Way Bill · BillKhata" }] }),
  component: EWayPage,
});

function EWayPage() {
  const { invoices, customers, business, attachEWayBill } = useStore();
  const taxInvoices = invoices.filter((i) => i.kind === "invoice");
  const [pickerId, setPickerId] = useState<string>(taxInvoices[0]?.id ?? "");
  const inv = taxInvoices.find((i) => i.id === pickerId);
  const customer = inv ? customers.find((c) => c.id === inv.customerId) : undefined;
  const totals = useMemo(() => inv ? computeTotals(inv.items, customer?.state, business.state) : null, [inv, customer, business.state]);

  const [mode, setMode] = useState<EWayBill["mode"]>("Road");
  const [vehicle, setVehicle] = useState("MH-12-XX-XXXX");
  const [transporter, setTransporter] = useState("");
  const [loading, setLoading] = useState(false);
  const generated = inv?.eWayBill;

  const mandatory = totals && totals.grand >= 50000;

  const generate = () => {
    if (!inv) return;
    if (!/^[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,3}[- ]?\d{1,4}$/i.test(vehicle.replace(/\s+/g, ""))) {
      toast.error("Invalid vehicle number", { description: "Expected format: MH-12-AB-1234" });
      return;
    }
    if (!transporter.trim()) {
      toast.error("Transporter ID / Name is required");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const w: EWayBill = { number: generateEWayNumber(), vehicle, mode, transporter, date: today() };
      attachEWayBill(inv.id, w);
      setLoading(false);
      toast.success("E-Way Bill generated via NIC", { description: `EBN ${w.number}` });
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="E-Way Bill Portal"
          subtitle="Generate NIC-compliant E-Way Bills for goods movement above ₹50,000."
        />

        {taxInvoices.length === 0 ? (
          <EmptyState icon={Truck} title="No tax invoices yet" description="Create a tax invoice first to generate an E-Way Bill." />
        ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <section className="space-y-4">
            <Card title="1. Source Invoice">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Invoice Picker</Label>
                  <div className="relative mt-1.5">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select value={pickerId} onChange={(e) => setPickerId(e.target.value)} className="ipt pl-8">
                      {taxInvoices.map((i) => {
                        const c = customers.find((x) => x.id === i.customerId);
                        return <option key={i.id} value={i.id}>{i.number} — {c?.name} ({fmtDate(i.date)})</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Document Valuation</Label>
                  <div className="mt-1.5 h-10 px-3 rounded-md bg-muted flex items-center font-semibold">{totals ? inr(totals.grand) : "—"}</div>
                </div>
              </div>

              {mandatory && (
                <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertTriangle className="w-4 h-4 text-warning-foreground shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-warning-foreground">Mandatory E-Way Bill Required</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Invoice value exceeds ₹50,000 — Rule 138 of CGST Rules.</div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="2. Consignor & Consignee (auto-filled)">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Consignor</div>
                  <div className="font-semibold">{business.name}</div>
                  <div className="text-muted-foreground text-xs">{business.address}</div>
                  <div className="font-mono text-xs mt-1">GSTIN {business.gstin}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Consignee (Ship To)</div>
                  <div className="font-semibold">{customer?.name ?? "—"}</div>
                  <div className="text-muted-foreground text-xs">{customer?.address}</div>
                  <div className="font-mono text-xs mt-1">{customer?.gstin ?? "Unregistered"}</div>
                </div>
              </div>
              {inv && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">HSN Codes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(inv.items.map((it) => it.hsn))).map((h) => (
                      <span key={h} className="px-2 py-0.5 rounded bg-muted text-xs font-mono">HSN {h}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="3. Transportation Details">
              <Label>Transport Mode</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(["Road", "Rail", "Air", "Ship"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn("h-10 rounded-md border text-sm font-medium transition-colors", mode === m ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted")}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div>
                  <Label>Vehicle Number</Label>
                  <input value={vehicle} onChange={(e) => setVehicle(e.target.value.toUpperCase())} placeholder="MH-12-AB-1234" className="ipt mt-1.5 font-mono" />
                  <p className="text-[11px] text-muted-foreground mt-1">Format: SS-DD-LL-NNNN (state code, district, series, number)</p>
                </div>
                <div>
                  <Label>Transporter ID / Name</Label>
                  <input value={transporter} onChange={(e) => setTransporter(e.target.value)} placeholder="VRL Logistics / 88AABCV1234E1Z5" className="ipt mt-1.5" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Button onClick={generate} disabled={loading || !inv} className="gap-1.5">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  {loading ? "Connecting to NIC Portal…" : "Generate E-Way Bill via NIC"}
                </Button>
                {generated && <span className="text-xs text-success">✓ Generated on {fmtDate(generated.date)}</span>}
              </div>
            </Card>
          </section>

          <aside>
            {generated ? (
              <div className="bg-card border rounded-xl overflow-hidden sticky top-20">
                <div className="bg-success/10 border-b border-success/20 p-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <div className="font-semibold text-sm">E-Way Bill Active</div>
                    <div className="text-xs text-muted-foreground">Valid for goods movement</div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">EBN</div>
                    <div className="text-2xl font-mono font-bold tracking-tight">{generated.number}</div>
                  </div>
                  <BarcodeMock value={generated.number} />
                  <dl className="text-sm space-y-1.5 pt-3 border-t">
                    <Row k="Consignor" v={business.name} />
                    <Row k="Consignee" v={customer?.name ?? "—"} />
                    <Row k="Mode" v={generated.mode} />
                    <Row k="Vehicle" v={generated.vehicle} mono />
                    <Row k="Transporter" v={generated.transporter} />
                    <Row k="Doc Value" v={totals ? inr(totals.grand) : "—"} />
                    <Row k="Generated" v={fmtDate(generated.date)} />
                  </dl>
                  <Button variant="outline" className="w-full gap-1.5"><Printer className="w-4 h-4" /> Print E-Way Bill</Button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground sticky top-20">
                <Truck className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                Fill in the form and submit to generate a 12-digit E-Way Bill Number with barcode.
              </div>
            )}
          </aside>
        </div>
        )}
      </div>
      <style>{`.ipt { width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.375rem; border: 1px solid var(--color-input); background: var(--color-card); font-size: 0.875rem; outline: none; } .ipt:focus { box-shadow: 0 0 0 2px var(--color-ring); }`}</style>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("font-medium text-right truncate", mono && "font-mono")}>{v}</dd>
    </div>
  );
}

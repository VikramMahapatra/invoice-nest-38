import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileBarChart2, ChevronDown, ChevronRight, Download, FileJson, FileText,
  CheckCircle2, Users, Globe2, Store, StickyNote, Layers, Calendar,
} from "lucide-react";
import { AppLayout, PageHeader, StatusBadge } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore, type Invoice } from "@/lib/store";
import { inr, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gstr1")({
  head: () => ({
    meta: [
      { title: "GSTR-1 · Outward Supplies Report" },
      { name: "description", content: "Section-wise GSTR-1 summary ready for GST portal upload or CA review." },
    ],
  }),
  component: Gstr1Page,
});

type SectionKey = "b2b" | "b2cl" | "b2cs" | "cdnr" | "hsn";

function Gstr1Page() {
  const { invoices, customers, business } = useStore();
  const [period, setPeriod] = useState("Aug 2026");
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    b2b: true, b2cl: false, b2cs: false, cdnr: false, hsn: false,
  });
  const [jsonReady, setJsonReady] = useState(false);

  const taxable = invoices.filter((i) => i.kind === "invoice" || i.kind === "credit_note" || i.kind === "debit_note");

  const enrich = (i: Invoice) => {
    const cust = customers.find((c) => c.id === i.customerId);
    const t = computeTotals(i.items, cust?.state, business.state);
    return { i, cust, t };
  };

  const rows = taxable.map(enrich);

  // B2B: customer has GSTIN
  const b2bGroups = useMemo(() => {
    const groups = new Map<string, { name: string; gstin: string; state?: string; rows: typeof rows }>();
    rows
      .filter(({ i, cust }) => i.kind === "invoice" && cust?.gstin)
      .forEach((r) => {
        const key = r.cust!.gstin!;
        if (!groups.has(key)) groups.set(key, { name: r.cust!.name, gstin: key, state: r.cust!.state, rows: [] });
        groups.get(key)!.rows.push(r);
      });
    return Array.from(groups.values());
  }, [rows]);

  // B2C Large: interstate, unregistered, > 2.5L
  const b2cl = rows.filter(({ i, cust, t }) =>
    i.kind === "invoice" && !cust?.gstin && t.interstate && t.grand > 250000
  );

  // B2C Small: everything else for unregistered
  const b2cs = rows.filter(({ i, cust, t }) =>
    i.kind === "invoice" && !cust?.gstin && !(t.interstate && t.grand > 250000)
  );

  // Credit/Debit notes
  const cdnr = rows.filter(({ i }) => i.kind === "credit_note" || i.kind === "debit_note");

  // HSN summary
  const hsnRows = useMemo(() => {
    const map = new Map<string, { hsn: string; desc: string; qty: number; unit: string; gst: number; taxable: number; tax: number; total: number }>();
    rows.filter(({ i }) => i.kind === "invoice").forEach(({ i, cust }) => {
      const intr = cust && cust.state !== business.state;
      i.items.forEach((it) => {
        const k = it.hsn + "-" + it.gst;
        const line = it.qty * it.price;
        const tax = (line * it.gst) / 100;
        const existing = map.get(k) ?? { hsn: it.hsn, desc: it.name, qty: 0, unit: it.unit, gst: it.gst, taxable: 0, tax: 0, total: 0 };
        existing.qty += it.qty;
        existing.taxable += line;
        existing.tax += tax;
        existing.total += line + tax;
        map.set(k, existing);
      });
      void intr;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows, business.state]);

  const summary = useMemo(() => {
    const sum = (arr: typeof rows) => arr.reduce(
      (a, r) => ({
        count: a.count + 1,
        taxable: a.taxable + r.t.subtotal,
        tax: a.tax + r.t.taxTotal,
        total: a.total + r.t.grand,
      }),
      { count: 0, taxable: 0, tax: 0, total: 0 }
    );
    return {
      b2b: sum(b2bGroups.flatMap((g) => g.rows)),
      b2cl: sum(b2cl),
      b2cs: sum(b2cs),
      cdnr: sum(cdnr),
    };
  }, [b2bGroups, b2cl, b2cs, cdnr]);

  const grandTaxable = summary.b2b.taxable + summary.b2cl.taxable + summary.b2cs.taxable;
  const grandTax = summary.b2b.tax + summary.b2cl.tax + summary.b2cs.tax;
  const grandTotal = summary.b2b.total + summary.b2cl.total + summary.b2cs.total;

  const toggle = (k: SectionKey) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const generateJson = () => {
    setJsonReady(true);
    setTimeout(() => setJsonReady(false), 4500);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="GSTR-1 · Outward Supplies"
          subtitle="Section-wise summary of all outward taxable supplies for the return period."
          actions={
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border bg-card text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium"
                >
                  {["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" className="gap-1.5"><FileText className="w-4 h-4" /> Download CA Copy (PDF)</Button>
              <Button onClick={generateJson} className="gap-1.5"><FileJson className="w-4 h-4" /> Download GST Portal JSON</Button>
            </div>
          }
        />

        {jsonReady && (
          <div className="mb-5 rounded-lg border border-success/30 bg-success/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-foreground">JSON generated successfully · GSTR1_{period.replace(" ", "_")}.json</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                File is ready for direct upload to the GST Portal (gst.gov.in → Returns → GSTR-1 → Prepare Offline → Upload).
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5"><Download className="w-4 h-4" /> Save File</Button>
          </div>
        )}

        {/* Period header */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <SummaryTile label="Return Period" value={period} sub={business.gstin} accent="primary" />
          <SummaryTile label="Total Invoices" value={String(summary.b2b.count + summary.b2cl.count + summary.b2cs.count)} sub={`${summary.cdnr.count} CR/DR notes`} />
          <SummaryTile label="Taxable Value" value={inr(grandTaxable)} sub="Net of discounts" />
          <SummaryTile label="Total Tax" value={inr(grandTax)} sub="CGST + SGST + IGST" />
          <SummaryTile label="Invoice Value" value={inr(grandTotal)} sub="Incl. all taxes" accent="success" />
        </div>

        <div className="space-y-4">
          {/* B2B */}
          <SectionCard
            open={open.b2b}
            onToggle={() => toggle("b2b")}
            icon={Users}
            code="4A, 4B, 4C, 6B, 6C"
            title="B2B Invoices"
            subtitle="Registered taxpayers (grouped by recipient GSTIN)"
            stats={[
              { label: "Suppliers", value: String(b2bGroups.length) },
              { label: "Invoices", value: String(summary.b2b.count) },
              { label: "Taxable", value: inr(summary.b2b.taxable) },
              { label: "Total Tax", value: inr(summary.b2b.tax) },
            ]}
          >
            <div className="space-y-4">
              {b2bGroups.map((g) => (
                <div key={g.gstin} className="rounded-lg border bg-background">
                  <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3 bg-muted/40">
                    <div>
                      <div className="font-medium text-sm">{g.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{g.gstin} · {g.state}</div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">{g.rows.length} invoice(s)</div>
                  </div>
                  <ResponsiveInvoiceTable rows={g.rows} />
                </div>
              ))}
              {!b2bGroups.length && <EmptyRow text="No B2B invoices in this period." />}
            </div>
          </SectionCard>

          {/* B2C Large */}
          <SectionCard
            open={open.b2cl}
            onToggle={() => toggle("b2cl")}
            icon={Globe2}
            code="5A, 5B"
            title="B2C Large Invoices"
            subtitle="Interstate, unregistered recipients · Invoice value > ₹2,50,000"
            stats={[
              { label: "Invoices", value: String(summary.b2cl.count) },
              { label: "Taxable", value: inr(summary.b2cl.taxable) },
              { label: "IGST", value: inr(summary.b2cl.tax) },
              { label: "Value", value: inr(summary.b2cl.total) },
            ]}
          >
            <ResponsiveInvoiceTable rows={b2cl} />
            {!b2cl.length && <EmptyRow text="No B2C Large invoices crossed the ₹2.5L interstate threshold." />}
          </SectionCard>

          {/* B2C Small */}
          <SectionCard
            open={open.b2cs}
            onToggle={() => toggle("b2cs")}
            icon={Store}
            code="7"
            title="B2C Small (Consolidated)"
            subtitle="Unregistered recipients · Invoice value ≤ ₹2,50,000"
            stats={[
              { label: "Invoices", value: String(summary.b2cs.count) },
              { label: "Taxable", value: inr(summary.b2cs.taxable) },
              { label: "Total Tax", value: inr(summary.b2cs.tax) },
              { label: "Value", value: inr(summary.b2cs.total) },
            ]}
          >
            <ResponsiveInvoiceTable rows={b2cs} consolidated />
            {!b2cs.length && <EmptyRow text="No B2C Small consolidated entries." />}
          </SectionCard>

          {/* CDNR */}
          <SectionCard
            open={open.cdnr}
            onToggle={() => toggle("cdnr")}
            icon={StickyNote}
            code="9B"
            title="Credit / Debit Notes"
            subtitle="Modifications linked to original tax invoices"
            stats={[
              { label: "Notes", value: String(summary.cdnr.count) },
              { label: "Adjustment", value: inr(summary.cdnr.total) },
            ]}
          >
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">Note No.</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Linked Invoice</th>
                    <th className="text-left px-3 py-2">Recipient</th>
                    <th className="text-right px-3 py-2">Taxable</th>
                    <th className="text-right px-3 py-2">Tax</th>
                    <th className="text-right px-3 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cdnr.map(({ i, cust, t }) => (
                    <tr key={i.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link to="/invoices/$id" params={{ id: i.id }} className="text-primary hover:underline">{i.number}</Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          i.kind === "credit_note" ? "bg-destructive/10 text-destructive border-destructive/25" : "bg-info/10 text-info border-info/25"
                        )}>
                          {i.kind === "credit_note" ? "Credit Note" : "Debit Note"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(i.date)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i.refInvoice ?? "—"}</td>
                      <td className="px-3 py-2">{cust?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{inr(t.subtotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{inr(t.taxTotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{inr(t.grand)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {cdnr.map(({ i, cust, t }) => (
                <div key={i.id} className="border rounded-lg p-3">
                  <div className="flex justify-between text-sm font-medium">{i.number}<span>{inr(t.grand)}</span></div>
                  <div className="text-xs text-muted-foreground">{i.kind === "credit_note" ? "Credit Note" : "Debit Note"} · {cust?.name}</div>
                  <div className="text-xs text-muted-foreground">Ref: {i.refInvoice ?? "—"} · {fmtDate(i.date)}</div>
                </div>
              ))}
            </div>
            {!cdnr.length && <EmptyRow text="No credit or debit notes raised this period." />}
          </SectionCard>

          {/* HSN summary */}
          <SectionCard
            open={open.hsn}
            onToggle={() => toggle("hsn")}
            icon={Layers}
            code="12"
            title="HSN-Wise Summary"
            subtitle="Aggregated quantity & value per HSN / SAC code"
            stats={[
              { label: "HSN codes", value: String(hsnRows.length) },
              { label: "Taxable", value: inr(hsnRows.reduce((s, r) => s + r.taxable, 0)) },
            ]}
          >
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">HSN</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-left px-3 py-2">UQC</th>
                    <th className="text-right px-3 py-2">Total Qty</th>
                    <th className="text-right px-3 py-2">Rate</th>
                    <th className="text-right px-3 py-2">Taxable</th>
                    <th className="text-right px-3 py-2">Tax</th>
                    <th className="text-right px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnRows.map((r) => (
                    <tr key={r.hsn + r.gst} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono">{r.hsn}</td>
                      <td className="px-3 py-2 max-w-[300px] truncate">{r.desc}</td>
                      <td className="px-3 py-2 uppercase text-xs text-muted-foreground">{r.unit}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.qty}</td>
                      <td className="px-3 py-2 text-right">{r.gst}%</td>
                      <td className="px-3 py-2 text-right tabular-nums">{inr(r.taxable)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{inr(r.tax)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{inr(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/40 font-medium">
                    <td className="px-3 py-2" colSpan={5}>Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">{inr(hsnRows.reduce((s, r) => s + r.taxable, 0))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{inr(hsnRows.reduce((s, r) => s + r.tax, 0))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{inr(hsnRows.reduce((s, r) => s + r.total, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {hsnRows.map((r) => (
                <div key={r.hsn + r.gst} className="border rounded-lg p-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="font-mono">{r.hsn}</span><span>{inr(r.total)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{r.desc}</div>
                  <div className="text-xs text-muted-foreground mt-1">Qty {r.qty} {r.unit} · {r.gst}% · Tax {inr(r.tax)}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "primary" | "success" }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 bg-card",
      accent === "primary" && "bg-primary/5 border-primary/20",
      accent === "success" && "bg-success/10 border-success/30",
    )}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function SectionCard({
  open, onToggle, icon: Icon, code, title, subtitle, stats, children,
}: {
  open: boolean; onToggle: () => void; icon: React.ComponentType<{ className?: string }>;
  code: string; title: string; subtitle: string;
  stats: { label: string; value: string }[]; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-4 md:px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Table {code}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>
        </div>
        <div className="hidden lg:flex items-center gap-6 mr-2">
          {stats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="text-sm font-medium tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t p-4 md:p-5">{children}</div>}
    </div>
  );
}

function ResponsiveInvoiceTable({ rows, consolidated }: { rows: { i: Invoice; cust?: { name: string; state: string; gstin?: string }; t: ReturnType<typeof computeTotals> }[]; consolidated?: boolean }) {
  if (!rows.length) return null;
  return (
    <>
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">Invoice</th>
              <th className="text-left px-3 py-2">Date</th>
              {!consolidated && <th className="text-left px-3 py-2">POS</th>}
              <th className="text-right px-3 py-2">Taxable</th>
              <th className="text-right px-3 py-2">CGST</th>
              <th className="text-right px-3 py-2">SGST</th>
              <th className="text-right px-3 py-2">IGST</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ i, cust, t }) => (
              <tr key={i.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to="/invoices/$id" params={{ id: i.id }} className="text-primary hover:underline">{i.number}</Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(i.date)}</td>
                {!consolidated && <td className="px-3 py-2 text-xs text-muted-foreground">{cust?.state?.split(" - ")[1] ?? "—"}</td>}
                <td className="px-3 py-2 text-right tabular-nums">{inr(t.subtotal)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(t.cgst)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(t.sgst)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(t.igst)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{inr(t.grand)}</td>
                <td className="px-3 py-2"><StatusBadge status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {rows.map(({ i, cust, t }) => (
          <div key={i.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Link to="/invoices/$id" params={{ id: i.id }} className="text-primary font-mono text-sm">{i.number}</Link>
              <StatusBadge status={i.status} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{cust?.name ?? "Walk-in"} · {fmtDate(i.date)}</div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="text-muted-foreground">Taxable</div><div className="text-right tabular-nums">{inr(t.subtotal)}</div>
              <div className="text-muted-foreground">Tax</div><div className="text-right tabular-nums">{inr(t.taxTotal)}</div>
              <div className="font-medium">Total</div><div className="text-right tabular-nums font-medium">{inr(t.grand)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg flex flex-col items-center gap-2">
      <FileBarChart2 className="w-5 h-5 opacity-50" />
      {text}
    </div>
  );
}

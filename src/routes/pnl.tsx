import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore } from "@/lib/store";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pnl")({
  head: () => ({ meta: [{ title: "Profit & Loss · BillKhata" }] }),
  component: PnL,
});

function PnL() {
  const { invoices, customers, business, expenses, products } = useStore();
  const [timeframe, setTimeframe] = useState<"Monthly" | "Quarterly" | "Annual">("Annual");
  const [fy, setFy] = useState("FY 2026-27");

  const data = useMemo(() => {
    const taxInvoices = invoices.filter((i) => i.kind === "invoice");
    const creditNotes = invoices.filter((i) => i.kind === "credit_note");
    const grossSales = taxInvoices.reduce((s, i) => s + computeTotals(i.items, customers.find((c) => c.id === i.customerId)?.state, business.state).subtotal, 0);
    const creditNoteValue = creditNotes.reduce((s, i) => s + computeTotals(i.items, customers.find((c) => c.id === i.customerId)?.state, business.state).subtotal, 0);
    const netRevenue = grossSales - creditNoteValue;

    // COGS from sold items × avg cost
    let cogs = 0;
    taxInvoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const p = products.find((x) => x.id === it.productId);
        if (p) cogs += p.avgCost * it.qty;
      });
    });

    const grossMargin = netRevenue - cogs;
    const grossMarginPct = netRevenue > 0 ? (grossMargin / netRevenue) * 100 : 0;

    const opCats = ["Rent", "Electricity", "Staff Salary", "Transport", "Other"] as const;
    const opex: Record<string, number> = {};
    opCats.forEach((c) => { opex[c] = 0; });
    expenses.forEach((e) => {
      if (e.category === "Stock Purchase") return; // already in inventory/COGS pipeline
      opex[e.category] = (opex[e.category] ?? 0) + e.amount;
    });
    const opexTotal = Object.values(opex).reduce((s, n) => s + n, 0);
    const netProfit = grossMargin - opexTotal;

    return { grossSales, creditNoteValue, netRevenue, cogs, grossMargin, grossMarginPct, opex, opexTotal, netProfit };
  }, [invoices, customers, business.state, expenses, products]);

  const exportCsv = () => {
    const rows = [
      ["Profit & Loss Statement", fy, timeframe],
      [],
      ["Gross Sales Revenue", data.grossSales],
      ["(-) Credit Notes Issued", data.creditNoteValue],
      ["Net Operational Revenue", data.netRevenue],
      ["(-) Cost of Goods Sold", data.cogs],
      ["Gross Margin", data.grossMargin],
      ["Gross Margin %", data.grossMarginPct.toFixed(2) + "%"],
      [],
      ["Operating Expenses"],
      ...Object.entries(data.opex).map(([k, v]) => [k, v]),
      ["Total Opex", data.opexTotal],
      [],
      ["Net Profit / (Loss)", data.netProfit],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PnL_${fy.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("P&L exported as CSV");
  };

  const isProfit = data.netProfit >= 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto">
        <PageHeader
          title="Profit & Loss Statement"
          subtitle="Managerial view of operating performance, derived live from invoices, inventory and expenses."
          actions={<Button variant="outline" onClick={exportCsv} className="gap-1.5"><Download className="w-4 h-4" /> Export CSV / Excel</Button>}
        />

        {/* Filter bar */}
        <div className="bg-card border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Financial Year</label>
            <select value={fy} onChange={(e) => setFy(e.target.value)} className="h-9 px-3 rounded-md border bg-background text-sm">
              <option>FY 2026-27</option><option>FY 2025-26</option><option>FY 2024-25</option>
            </select>
          </div>
          <div className="ml-auto flex items-center bg-muted rounded-md p-0.5 text-xs">
            {(["Monthly", "Quarterly", "Annual"] as const).map((t) => (
              <button key={t} onClick={() => setTimeframe(t)} className={cn("px-3 h-7 rounded-[5px] transition-colors", timeframe === t ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground")}>{t}</button>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          {/* Revenue */}
          <Section label="Operational Revenue" sign="+" tone="success">
            <Line label="Gross Sales Revenue" value={data.grossSales} />
            <Line label="Less: Credit Notes Issued" value={-data.creditNoteValue} muted />
            <Line label="Net Operational Revenue" value={data.netRevenue} bold />
          </Section>

          {/* COGS */}
          <Section label="Cost of Goods Sold" sign="−" tone="destructive">
            <Line label="COGS (from inventory avg cost × qty sold)" value={-data.cogs} />
          </Section>

          {/* Gross Margin */}
          <div className="px-6 py-4 bg-muted/30 border-y flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">= Gross Margin</div>
              <div className="text-xl font-semibold mt-0.5">{inr(data.grossMargin)}</div>
            </div>
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
              data.grossMarginPct >= 30 ? "bg-success/10 text-success border-success/30" : data.grossMarginPct >= 15 ? "bg-warning/15 text-warning-foreground border-warning/30" : "bg-destructive/10 text-destructive border-destructive/25")}>
              {data.grossMarginPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {data.grossMarginPct.toFixed(1)}% margin
            </span>
          </div>

          {/* Opex */}
          <Section label="Operating Expenses" sign="−" tone="destructive">
            {Object.entries(data.opex).map(([k, v]) => (
              <Line key={k} label={k} value={-v} />
            ))}
            <Line label="Total Operating Expenses" value={-data.opexTotal} bold />
          </Section>

          {/* Net Profit Hero */}
          <div className={cn("p-8 text-center", isProfit ? "bg-success/5" : "bg-destructive/5")}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">= Net {isProfit ? "Profit" : "Loss"} ({fy})</div>
            <div className={cn("mt-2 text-5xl md:text-6xl font-bold tracking-tight tabular-nums", isProfit ? "text-success" : "text-destructive")}>
              {isProfit ? "" : "(" }{inr(Math.abs(data.netProfit))}{isProfit ? "" : ")"}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {isProfit ? "Net of all operating costs, COGS and credit notes." : "Operating costs and COGS exceed net revenue."}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Section({ label, sign, tone, children }: { label: string; sign: string; tone: "success" | "destructive"; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold", tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{sign}</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      </div>
      <div className="space-y-1.5 pl-8">{children}</div>
    </div>
  );
}

function Line({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between items-baseline text-sm py-1", bold && "border-t pt-2 font-semibold", muted && "text-muted-foreground")}>
      <span>{label}</span>
      <span className={cn("tabular-nums font-medium", bold && "text-base")}>{value < 0 ? `(${inr(Math.abs(value))})` : inr(value)}</span>
    </div>
  );
}

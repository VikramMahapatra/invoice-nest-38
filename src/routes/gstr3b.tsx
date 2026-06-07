import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Landmark, TrendingUp, TrendingDown, Calculator, Copy, Check, Calendar,
  Download, AlertCircle, CheckCircle2, IndianRupee, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { computeTotals, useStore } from "@/lib/store";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gstr3b")({
  head: () => ({
    meta: [
      { title: "GSTR-3B · Monthly Tax Summary" },
      { name: "description", content: "Auto-computed CGST, SGST, IGST liability and Input Tax Credit ready for filing." },
    ],
  }),
  component: Gstr3bPage,
});

function Gstr3bPage() {
  const { invoices, customers, business, expenses } = useStore();
  const [period, setPeriod] = useState("Aug 2026");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Outward tax liability from invoices
  const liability = useMemo(() => {
    let cgst = 0, sgst = 0, igst = 0, taxable = 0;
    invoices.filter((i) => i.kind === "invoice").forEach((i) => {
      const cust = customers.find((c) => c.id === i.customerId);
      const t = computeTotals(i.items, cust?.state, business.state);
      cgst += t.cgst; sgst += t.sgst; igst += t.igst; taxable += t.subtotal;
    });
    return { cgst, sgst, igst, taxable, total: cgst + sgst + igst };
  }, [invoices, customers, business.state]);

  // Adjustments from credit/debit notes (informational)
  const adjustments = useMemo(() => {
    let net = 0;
    invoices.filter((i) => i.kind === "credit_note" || i.kind === "debit_note").forEach((i) => {
      const cust = customers.find((c) => c.id === i.customerId);
      const t = computeTotals(i.items, cust?.state, business.state);
      net += (i.kind === "debit_note" ? 1 : -1) * t.taxTotal;
    });
    return net;
  }, [invoices, customers, business.state]);

  // ITC from GST-eligible expenses (assume intrastate purchases for demo → CGST/SGST split)
  const itc = useMemo(() => {
    const eligible = expenses.filter((e) => e.gstEligible && e.gstAmount);
    const total = eligible.reduce((s, e) => s + (e.gstAmount ?? 0), 0);
    const cgst = total / 2;
    const sgst = total / 2;
    const igst = 0;
    return { cgst, sgst, igst, total, count: eligible.length };
  }, [expenses]);

  const net = {
    cgst: Math.max(0, liability.cgst - itc.cgst),
    sgst: Math.max(0, liability.sgst - itc.sgst),
    igst: Math.max(0, liability.igst - itc.igst),
  };
  const netTotal = net.cgst + net.sgst + net.igst;

  const carryForward = {
    cgst: Math.max(0, itc.cgst - liability.cgst),
    sgst: Math.max(0, itc.sgst - liability.sgst),
    igst: Math.max(0, itc.igst - liability.igst),
  };
  const cfTotal = carryForward.cgst + carryForward.sgst + carryForward.igst;

  const copy = (key: string, value: number) => {
    navigator.clipboard?.writeText(String(Math.round(value)));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1400);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader
          title="GSTR-3B · Monthly Tax Summary"
          subtitle="Auto-computed net tax liability — copy values directly into the GST Portal."
          actions={
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border bg-card text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent focus:outline-none font-medium">
                  {["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <Button variant="outline" className="gap-1.5"><Download className="w-4 h-4" /> Download Worksheet</Button>
              <Button className="gap-1.5"><Landmark className="w-4 h-4" /> Open GST Portal</Button>
            </div>
          }
        />

        {/* Filing checklist */}
        <div className="rounded-xl border bg-card p-4 md:p-5 mb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Step done label="Outward supplies aggregated" />
            <Step done label="ITC from expenses calculated" />
            <Step done label="Net liability computed" />
            <Step label="Cash ledger funded" />
            <Step label="Filed with EVC / DSC" />
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Due date: 20 Sep 2026
            </div>
          </div>
        </div>

        {/* 3-section split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {/* Outward */}
          <SectionPanel
            tone="primary"
            icon={ArrowUpFromLine}
            code="3.1"
            title="Outward Tax Liability"
            subtitle="GST collected on sales invoices"
          >
            <TaxRow head label="Component" cgst="CGST" sgst="SGST" igst="IGST" />
            <TaxRow
              label="(a) Taxable supplies"
              cgst={inr(liability.cgst)} sgst={inr(liability.sgst)} igst={inr(liability.igst)}
              onCopy={(c) => copy(`l-${c}`, c === "cgst" ? liability.cgst : c === "sgst" ? liability.sgst : liability.igst)}
              copiedKey={copiedKey} keyPrefix="l"
            />
            <TaxRow label="(b) Inter-state to unregistered" cgst="—" sgst="—" igst={inr(liability.igst)} muted />
            <TaxRow label="(c) Adjustments (CN/DN)" cgst="—" sgst="—" igst={inr(adjustments)} muted />
            <Divider />
            <TotalRow label="Output Tax" value={inr(liability.total)} tone="primary" />
            <div className="text-xs text-muted-foreground mt-2">
              Computed from {invoices.filter((i) => i.kind === "invoice").length} tax invoices · Taxable value {inr(liability.taxable)}
            </div>
          </SectionPanel>

          {/* ITC */}
          <SectionPanel
            tone="info"
            icon={ArrowDownToLine}
            code="4"
            title="Eligible Input Tax Credit"
            subtitle="GST paid on business purchases"
          >
            <TaxRow head label="Component" cgst="CGST" sgst="SGST" igst="IGST" />
            <TaxRow
              label="(A) Import / Inputs"
              cgst={inr(itc.cgst)} sgst={inr(itc.sgst)} igst={inr(itc.igst)}
              onCopy={(c) => copy(`i-${c}`, c === "cgst" ? itc.cgst : c === "sgst" ? itc.sgst : itc.igst)}
              copiedKey={copiedKey} keyPrefix="i"
            />
            <TaxRow label="(B) Ineligible / Reversed" cgst="—" sgst="—" igst="—" muted />
            <Divider />
            <TotalRow label="Net ITC Available" value={inr(itc.total)} tone="info" />
            <div className="text-xs text-muted-foreground mt-2">
              From {itc.count} GST-eligible expenses · Verify against GSTR-2B before claiming
            </div>
          </SectionPanel>

          {/* Net payable */}
          <SectionPanel
            tone={cfTotal > 0 ? "success" : "warning"}
            icon={Calculator}
            code="6.1"
            title="Net GST Payable"
            subtitle="Output Tax − Input Tax Credit"
          >
            <TaxRow head label="Component" cgst="CGST" sgst="SGST" igst="IGST" />
            <TaxRow
              label="Output Tax"
              cgst={inr(liability.cgst)} sgst={inr(liability.sgst)} igst={inr(liability.igst)} muted
            />
            <TaxRow
              label="Less: ITC"
              cgst={"− " + inr(itc.cgst)} sgst={"− " + inr(itc.sgst)} igst={"− " + inr(itc.igst)} muted
            />
            <Divider />
            <TaxRow
              label="Net Payable"
              cgst={inr(net.cgst)} sgst={inr(net.sgst)} igst={inr(net.igst)} strong
              onCopy={(c) => copy(`n-${c}`, c === "cgst" ? net.cgst : c === "sgst" ? net.sgst : net.igst)}
              copiedKey={copiedKey} keyPrefix="n"
            />
            <Divider />
            {cfTotal > 0 ? (
              <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  ITC Ledger Carry-Forward · {inr(cfTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Your ITC exceeds liability this month. The surplus is carried forward to next month's credit ledger.
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <IndianRupee className="w-4 h-4" />
                  Cash Liability · {inr(netTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Fund your electronic cash ledger before 20 Sep 2026 to avoid interest @ 18% p.a.
                </div>
              </div>
            )}
          </SectionPanel>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric icon={TrendingUp} tone="primary" label="Output Tax" value={inr(liability.total)} sub={`On ${inr(liability.taxable)} sales`} />
          <Metric icon={TrendingDown} tone="info" label="ITC Claimed" value={inr(itc.total)} sub={`From ${itc.count} bills`} />
          <Metric icon={Calculator} tone={cfTotal > 0 ? "success" : "warning"} label={cfTotal > 0 ? "Carry-Forward" : "Net Payable"} value={inr(cfTotal > 0 ? cfTotal : netTotal)} sub={cfTotal > 0 ? "Added to ITC ledger" : "Due before 20 Sep"} />
          <Metric icon={Landmark} tone="muted" label="Late Fee" value={inr(0)} sub="No delay anticipated" />
        </div>
      </div>
    </AppLayout>
  );
}

function SectionPanel({
  tone, icon: Icon, code, title, subtitle, children,
}: {
  tone: "primary" | "info" | "success" | "warning";
  icon: React.ComponentType<{ className?: string }>;
  code: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  const toneMap = {
    primary: "bg-primary/5 border-primary/20 text-primary",
    info: "bg-info/10 border-info/25 text-info",
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
  } as const;
  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
      <div className={cn("px-4 py-3 border-b flex items-center gap-3", toneMap[tone])}>
        <div className="w-9 h-9 rounded-lg bg-background/70 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/70 text-muted-foreground">§ {code}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function TaxRow({
  label, cgst, sgst, igst, head, muted, strong, onCopy, copiedKey, keyPrefix,
}: {
  label: string; cgst: React.ReactNode; sgst: React.ReactNode; igst: React.ReactNode;
  head?: boolean; muted?: boolean; strong?: boolean;
  onCopy?: (c: "cgst" | "sgst" | "igst") => void; copiedKey?: string | null; keyPrefix?: string;
}) {
  const cellCls = cn(
    "px-2 py-2 text-right tabular-nums",
    head && "text-[10px] uppercase tracking-wider text-muted-foreground",
    muted && "text-muted-foreground",
    strong && "font-semibold text-foreground",
  );
  const Cell = ({ value, type }: { value: React.ReactNode; type: "cgst" | "sgst" | "igst" }) => {
    const key = `${keyPrefix}-${type}`;
    const isCopied = copiedKey === key;
    const showCopy = onCopy && typeof value === "string" && value.startsWith("₹");
    return (
      <td className={cellCls}>
        <div className="flex items-center justify-end gap-1.5 group">
          {showCopy && (
            <button
              onClick={() => onCopy!(type)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted",
                isCopied && "opacity-100 text-success"
              )}
              title="Copy to clipboard"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
          <span>{value}</span>
        </div>
      </td>
    );
  };
  return (
    <table className="w-full text-sm">
      <tbody>
        <tr className={cn("border-b last:border-0", head && "border-b-2")}>
          <td className={cn("py-2 pr-2 text-sm", head ? "text-[10px] uppercase tracking-wider text-muted-foreground" : muted ? "text-muted-foreground" : "text-foreground", strong && "font-semibold")}>
            {label}
          </td>
          <Cell value={cgst} type="cgst" />
          <Cell value={sgst} type="sgst" />
          <Cell value={igst} type="igst" />
        </tr>
      </tbody>
    </table>
  );
}

function Divider() {
  return <div className="h-px bg-border my-1" />;
}

function TotalRow({ label, value, tone }: { label: string; value: string; tone: "primary" | "info" }) {
  return (
    <div className={cn(
      "mt-2 rounded-lg p-3 flex items-center justify-between",
      tone === "primary" ? "bg-primary/10" : "bg-info/10"
    )}>
      <span className="text-sm font-medium">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Metric({ icon: Icon, tone, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "info" | "success" | "warning" | "muted";
  label: string; value: string; sub: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/15 text-info",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    muted: "bg-muted text-muted-foreground",
  } as const;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tones[tone])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function Step({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
        done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground border"
      )}>
        {done ? <Check className="w-3 h-3" /> : "○"}
      </div>
      <span className={cn("text-sm", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

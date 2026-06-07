import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload, CheckCircle2, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Business Setup · BillKhata" }] }),
  component: Onboarding,
});

const STATES = ["Maharashtra - 27", "Delhi - 07", "Gujarat - 24", "Karnataka - 29", "Tamil Nadu - 33", "Uttar Pradesh - 09", "West Bengal - 19", "Rajasthan - 08"];

function Onboarding() {
  const { business, setBusiness } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(business);
  const [verified, setVerified] = useState(true);

  const steps = ["Business", "GST Details", "Branding", "Done"];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i + 1 === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i + 1 < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-8 shadow-sm">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold">Tell us about your business</h2>
              <p className="text-sm text-muted-foreground mt-1">This appears on every invoice you generate.</p>
              <div className="mt-6 space-y-4">
                <Field label="Business Name">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ipt" />
                </Field>
                <Field label="Registered Address">
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="ipt min-h-[80px]" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ipt" /></Field>
                  <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="ipt" /></Field>
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold">GST & Location</h2>
              <p className="text-sm text-muted-foreground mt-1">We auto-detect intra/interstate tax splits from your state.</p>
              <div className="mt-6 space-y-4">
                <Field label="GSTIN (15 characters)">
                  <div className="flex gap-2">
                    <input
                      value={form.gstin}
                      maxLength={15}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      className="ipt font-mono tracking-wider"
                    />
                    {verified && form.gstin.length === 15 && (
                      <span className="inline-flex items-center gap-1.5 px-3 rounded-md bg-success/15 text-success text-sm font-medium border border-success/30">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Format: 27 (state) + 10-digit PAN + 1Z + check digit</p>
                </Field>
                <Field label="State of Registration">
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="ipt">
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold">Logo & Branding</h2>
              <p className="text-sm text-muted-foreground mt-1">Drop your logo for crisp invoices and quotations.</p>
              <div className="mt-6 border-2 border-dashed rounded-xl p-10 text-center hover:bg-muted/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div className="mt-3 font-medium">Drop your logo here</div>
                <div className="text-xs text-muted-foreground mt-1">PNG or JPG · square preferred · max 2MB</div>
                <Button variant="outline" size="sm" className="mt-4">Choose file</Button>
              </div>
            </>
          )}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold">You're all set, {form.name}!</h2>
              <p className="text-muted-foreground mt-2">Your GST suite is ready. Let's create your first invoice.</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-1.5">Continue <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button onClick={() => { setBusiness(form); nav({ to: "/" }); }} className="gap-1.5">
                <Building2 className="w-4 h-4" /> Enter Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
      <style>{`.ipt { width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.375rem; border: 1px solid var(--color-input); background: var(--color-card); font-size: 0.875rem; outline: none; }
      .ipt:focus { box-shadow: 0 0 0 2px var(--color-ring); border-color: transparent; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

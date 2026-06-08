import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login · BillKhata" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("aanya.desai@billkhata.com");
  const [pwd, setPwd] = useState("");
  const [twofa, setTwofa] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"pwd" | "2fa">("pwd");

  const submitPwd = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("2fa");
  };
  const submit2fa = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="relative flex items-center gap-2 font-semibold text-lg">
          <div className="w-9 h-9 rounded-lg bg-destructive/90 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          BillKhata · Admin
        </div>
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-medium border border-destructive/30">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Restricted Access
          </div>
          <h2 className="text-3xl font-semibold leading-tight">
            Platform control for the <span className="text-sidebar-primary">BillKhata</span> ops team.
          </h2>
          <p className="text-sidebar-foreground/70 max-w-md">
            Manage tenants, monitor MRR, handle billing escalations and respond to support tickets across every business on BillKhata.
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { k: "Tenants", v: "1,284" },
              { k: "MRR", v: "₹18.2L" },
              { k: "Uptime", v: "99.98%" },
            ].map((x) => (
              <div key={x.k} className="p-4 rounded-lg bg-sidebar-accent/40 border border-sidebar-border">
                <div className="text-xs text-sidebar-foreground/60">{x.k}</div>
                <div className="font-semibold mt-1">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">© 2026 BillKhata Technologies · SOC 2 Type II · ISO 27001</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Admin sign-in</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "pwd" ? "Use your platform credentials" : "Enter the 6-digit code from your authenticator app"}
          </p>

          {step === "pwd" ? (
            <form onSubmit={submitPwd} className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Work email</label>
                <div className="mt-1.5 flex h-11 rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring">
                  <span className="flex items-center px-3 border-r"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-3 bg-transparent outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="mt-1.5 flex h-11 rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring">
                  <span className="flex items-center px-3 border-r"><Lock className="w-3.5 h-3.5 text-muted-foreground" /></span>
                  <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder="••••••••••" className="flex-1 px-3 bg-transparent outline-none text-sm" />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 gap-1.5">Continue <ArrowRight className="w-4 h-4" /></Button>
              <div className="text-xs text-muted-foreground flex justify-between">
                <button type="button" className="text-primary font-medium hover:underline">Forgot password?</button>
                <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="w-3 h-3" /> SSO ready</span>
              </div>
            </form>
          ) : (
            <form onSubmit={submit2fa} className="mt-8 space-y-4">
              <div className="p-3 rounded-md border bg-muted/40 text-xs text-muted-foreground flex items-start gap-2">
                <KeyRound className="w-4 h-4 mt-0.5 text-primary" />
                <span>Two-factor authentication is mandatory for admin accounts. Demo code: <b className="text-foreground">123 456</b></span>
              </div>
              <div className="flex gap-2 justify-between">
                {twofa.map((d, i) => (
                  <input key={i} value={d} maxLength={1} id={"2fa-" + i}
                    onChange={(e) => {
                      const next = [...twofa]; next[i] = e.target.value.replace(/\D/g, ""); setTwofa(next);
                      const el = document.getElementById("2fa-" + (i + 1)); if (e.target.value && el) (el as HTMLInputElement).focus();
                    }}
                    className="w-11 h-12 text-center text-lg font-semibold rounded-md border bg-card focus:ring-2 focus:ring-ring outline-none" />
                ))}
              </div>
              <Button type="submit" className="w-full h-11 gap-1.5">Sign in to Admin <ArrowRight className="w-4 h-4" /></Button>
              <button type="button" onClick={() => setStep("pwd")} className="w-full text-sm text-muted-foreground hover:text-foreground">← Back</button>
            </form>
          )}

          <p className="mt-8 text-sm text-muted-foreground text-center">
            Looking for your business account? <Link to="/login" className="text-primary font-medium hover:underline">Tenant sign-in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

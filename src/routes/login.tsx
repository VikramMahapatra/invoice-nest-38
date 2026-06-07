import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Lock, ShieldCheck, ArrowRight, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Sharma Traders GST Suite" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("98220 11223");
  const [pwd, setPwd] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [count, setCount] = useState(30);

  useEffect(() => {
    if (!otpSent || count === 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpSent, count]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
          BillKhata
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">GST billing built for India's <span className="text-sidebar-primary">MSMEs</span>.</h2>
          <p className="text-sidebar-foreground/70 max-w-md">Generate compliant tax invoices, track payments on UPI &amp; NEFT, and reconcile GSTR-1 — all in under 30 seconds per bill.</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { k: "GST Compliant", v: "GSTR-1 / 3B" },
              { k: "Multi-staff", v: "Role based" },
              { k: "Trusted", v: "12k+ MSMEs" },
            ].map((x) => (
              <div key={x.k} className="p-4 rounded-lg bg-sidebar-accent/40">
                <div className="text-xs text-sidebar-foreground/60">{x.k}</div>
                <div className="font-medium mt-1">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-sidebar-foreground/50">© 2026 BillKhata Technologies · Made in Pune</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Sharma Traders' account</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
              <div className="mt-1.5 flex h-11 rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring">
                <span className="flex items-center gap-1.5 px-3 border-r text-sm font-medium"><Phone className="w-3.5 h-3.5" /> +91</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-3 bg-transparent outline-none text-sm" />
              </div>
            </div>

            {mode === "password" ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="mt-1.5 flex h-11 rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring">
                  <span className="flex items-center px-3 border-r"><Lock className="w-3.5 h-3.5 text-muted-foreground" /></span>
                  <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder="Enter password" className="flex-1 px-3 bg-transparent outline-none text-sm" />
                </div>
              </div>
            ) : !otpSent ? (
              <Button type="button" onClick={() => { setOtpSent(true); setCount(30); }} className="w-full h-11">
                Send OTP to +91 {phone}
              </Button>
            ) : (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Enter 4-digit OTP</label>
                <div className="mt-1.5 flex gap-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      value={d}
                      maxLength={1}
                      onChange={(e) => {
                        const next = [...otp]; next[i] = e.target.value.replace(/\D/g, ""); setOtp(next);
                        const el = document.getElementById("otp-" + (i + 1)); if (e.target.value && el) (el as HTMLInputElement).focus();
                      }}
                      id={"otp-" + i}
                      className="w-12 h-12 text-center text-lg font-semibold rounded-md border bg-card focus:ring-2 focus:ring-ring outline-none"
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Didn't receive? {count > 0 ? <>Resend in <b className="text-foreground">{count}s</b></> : <button type="button" onClick={() => setCount(30)} className="text-primary font-medium">Resend OTP</button>}</span>
                  <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="w-3 h-3" /> Demo OTP: 4321</span>
                </div>
              </div>
            )}

            {(mode === "password" || (mode === "otp" && otpSent)) && (
              <Button type="submit" className="w-full h-11 gap-1.5">Sign in <ArrowRight className="w-4 h-4" /></Button>
            )}

            <button type="button" onClick={() => { setMode(mode === "password" ? "otp" : "password"); setOtpSent(false); }} className="w-full text-sm text-primary font-medium hover:underline">
              {mode === "password" ? "Login via OTP instead" : "Use password instead"}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground text-center">
            New to BillKhata? <Link to="/onboarding" className="text-primary font-medium hover:underline">Set up your business</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

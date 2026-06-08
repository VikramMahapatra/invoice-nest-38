import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminPageHeader } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Globe, Key, Users } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings · BillKhata Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <AdminPageHeader title="Platform settings" subtitle="Configure how BillKhata operates across all tenants" />

        <div className="space-y-4">
          <Section icon={Globe} title="Platform identity" desc="Brand and customer-facing details">
            <Field label="Platform name" value="BillKhata" />
            <Field label="Support email" value="support@billkhata.com" />
            <Field label="Marketing site" value="https://billkhata.com" />
          </Section>

          <Section icon={Shield} title="Security & compliance" desc="Defaults applied to every new tenant">
            <Toggle label="Mandatory 2FA for admins" sub="All super admins must enroll an authenticator app" on />
            <Toggle label="Force tenant 2FA on Enterprise plan" sub="Owners of Enterprise tenants are required to enable 2FA" on />
            <Toggle label="Audit log retention" sub="Retain admin activity logs for 365 days" on />
            <Toggle label="IP allowlist for admin panel" sub="Restrict /admin access to corporate office IP range" />
          </Section>

          <Section icon={Mail} title="Email & notifications" desc="Outbound platform communications">
            <Field label="Transactional sender" value="no-reply@billkhata.com" />
            <Field label="Notification webhook" value="https://hooks.billkhata.internal/ops" mono />
            <Toggle label="Email digest to admins" sub="Daily summary of signups, churn and failed payments" on />
          </Section>

          <Section icon={Key} title="API & integrations" desc="Platform API keys and third-party services">
            <Field label="Public API key" value="pk_live_••••••••••••••cf28" mono />
            <Field label="Webhook signing secret" value="whsec_••••••••••••••6f12" mono />
            <div className="pt-2">
              <Button variant="outline" size="sm">Rotate keys…</Button>
            </div>
          </Section>

          <Section icon={Users} title="Admin team" desc="People with access to the BillKhata Admin panel">
            {[
              { n: "Aanya Desai", r: "Super Admin", e: "aanya.desai@billkhata.com" },
              { n: "Vikram Rao", r: "Billing Admin", e: "vikram@billkhata.com" },
              { n: "Neha Kapoor", r: "Support Lead", e: "neha@billkhata.com" },
              { n: "Arun Mehta", r: "Support Agent", e: "arun@billkhata.com" },
            ].map((m) => (
              <div key={m.e} className="flex items-center justify-between py-2.5 border-t first:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{m.n.split(" ").map(s => s[0]).join("")}</div>
                  <div>
                    <div className="text-sm font-medium">{m.n}</div>
                    <div className="text-xs text-muted-foreground">{m.e}</div>
                  </div>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-muted">{m.r}</div>
              </div>
            ))}
            <div className="pt-3"><Button size="sm">+ Invite admin</Button></div>
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 py-4 border-b flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</div>
    </div>
  );
}
function Toggle({ label, sub, on }: { label: string; sub: string; on?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <button className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 ${on ? "right-0.5" : "left-0.5"} w-5 h-5 bg-white rounded-full shadow`} />
      </button>
    </div>
  );
}

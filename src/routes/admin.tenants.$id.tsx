import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AdminLayout, AdminPageHeader, TenantStatusBadge } from "@/components/AdminLayout";
import { tenants, billingHistory } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, HardDrive, Users, FileText, Ban, LogIn, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/tenants/$id")({
  head: () => ({ meta: [{ title: "Tenant Detail · BillKhata Admin" }] }),
  component: TenantDetail,
});

const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

function TenantDetail() {
  const { id } = useParams({ from: "/admin/tenants/$id" });
  const tenant = tenants.find((t) => t.id === id);
  if (!tenant) {
    return (
      <AdminLayout>
        <div className="p-8 max-w-2xl mx-auto">
          <Link to="/admin/tenants" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
          <div className="mt-6 p-12 border rounded-xl text-center">
            <div className="text-lg font-semibold">Tenant not found</div>
            <div className="text-sm text-muted-foreground mt-1">No tenant with ID <code>{id}</code>.</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const usage = Math.round((tenant.storageGB / tenant.storageLimitGB) * 100);
  const invoices = billingHistory.filter((b) => b.tenant === tenant.name);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <Link to="/admin/tenants" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-3.5 h-3.5" /> All tenants</Link>

        <AdminPageHeader
          title={tenant.name}
          subtitle={`${tenant.id} · Joined ${tenant.joined}`}
          actions={
            <>
              <Button variant="outline" className="gap-1.5"><LogIn className="w-4 h-4" /> Impersonate</Button>
              <Button variant="outline" className="gap-1.5"><RefreshCw className="w-4 h-4" /> Reset Password</Button>
              {tenant.status !== "Suspended"
                ? <Button variant="destructive" className="gap-1.5"><Ban className="w-4 h-4" /> Suspend</Button>
                : <Button className="gap-1.5">Reactivate</Button>}
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Plan</div>
                  <div className="text-xl font-semibold mt-1">{tenant.plan} <span className="text-base font-normal text-muted-foreground">· {inr(tenant.mrr)}/mo</span></div>
                </div>
                <TenantStatusBadge status={tenant.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <Metric icon={Users} label="Users" value={String(tenant.users)} />
                <Metric icon={FileText} label="Invoices" value={fmt(tenant.invoices)} />
                <Metric icon={Calendar} label="Renews on" value={tenant.renewsOn} />
                <Metric icon={Calendar} label="Last active" value={tenant.lastActive} />
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Storage</span>
                  <span className="font-medium">{tenant.storageGB} GB / {tenant.storageLimitGB} GB</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${usage > 80 ? "bg-destructive" : usage > 60 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(100, usage)}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold">Billing history</div>
                <Link to="/admin/billing" className="text-xs text-primary font-medium hover:underline">All billing →</Link>
              </div>
              {invoices.length === 0 ? (
                <div className="px-5 py-10 text-sm text-muted-foreground text-center">No billing records yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="text-left font-medium px-5 py-2.5">Invoice</th>
                      <th className="text-left font-medium px-3 py-2.5">Date</th>
                      <th className="text-left font-medium px-3 py-2.5">Method</th>
                      <th className="text-right font-medium px-3 py-2.5">Amount</th>
                      <th className="text-left font-medium px-5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="px-5 py-3 font-mono text-xs">{b.id}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{b.date}</td>
                        <td className="px-3 py-3 text-xs">{b.method}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{inr(b.amount)}</td>
                        <td className="px-5 py-3"><TenantStatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="text-sm font-semibold mb-3">Contact</div>
              <div className="space-y-2.5 text-sm">
                <Row icon={Users} label={tenant.owner} sub="Account owner" />
                <Row icon={Mail} label={tenant.email} sub="Primary email" />
                <Row icon={Phone} label={tenant.phone} sub="Phone" />
                <Row icon={MapPin} label={tenant.state} sub="State of registration" />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="text-sm font-semibold mb-3">Tax registration</div>
              <div className="text-xs text-muted-foreground">GSTIN</div>
              <div className="font-mono text-sm mt-0.5">{tenant.gstin}</div>
              <div className="mt-3 p-2.5 rounded-md bg-success/10 text-success text-xs inline-flex items-center gap-1.5">
                ✓ Verified with GSTN portal
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="text-sm font-semibold mb-3">Danger zone</div>
              <p className="text-xs text-muted-foreground mb-3">Deleting a tenant is irreversible and will purge invoices, payments and GST filings.</p>
              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">Delete tenant…</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
function Row({ icon: Icon, label, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center mt-0.5"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

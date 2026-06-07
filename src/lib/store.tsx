import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { addDays, today } from "./format";

export type Role = "Owner" | "Accountant" | "Staff" | "Viewer";

export type Customer = {
  id: string;
  name: string;
  gstin?: string;
  phone: string;
  email?: string;
  state: string; // "Maharashtra - 27"
  address: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  hsn: string;
  price: number;
  unit: string;
  gst: number;
};

export type LineItem = {
  productId?: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  price: number;
  gst: number;
};

export type InvoiceStatus = "Draft" | "Sent" | "Partially Paid" | "Paid" | "Overdue";
export type InvoiceKind = "invoice" | "quotation" | "credit_note" | "debit_note";

export type Payment = {
  id: string;
  date: string;
  amount: number;
  mode: "UPI" | "Cash" | "NEFT" | "IMPS";
  note?: string;
};

export type Invoice = {
  id: string;
  number: string;
  kind: InvoiceKind;
  refInvoice?: string; // for notes
  customerId: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  notes?: string;
  payments: Payment[];
  status: InvoiceStatus;
  createdBy: string;
};

export type Expense = {
  id: string;
  name: string;
  category: "Rent" | "Electricity" | "Stock Purchase" | "Staff Salary" | "Transport" | "Other";
  date: string;
  amount: number;
  vendor: string;
  gstEligible: boolean;
  gstAmount?: number;
};

export type RecurringProfile = {
  id: string;
  customerId: string;
  items: LineItem[];
  frequency: "Weekly" | "Monthly" | "Quarterly";
  startDate: string;
  endDate?: string;
  indefinite: boolean;
  autoSendWhatsApp: boolean;
  nextDate: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
};

type Business = {
  name: string;
  gstin: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  bank: { name: string; account: string; ifsc: string; branch: string };
};

type Store = {
  business: Business;
  setBusiness: (b: Business) => void;
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id">) => Customer;
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => Product;
  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id" | "number" | "payments" | "status" | "createdBy"> & { number?: string; kind?: InvoiceKind; refInvoice?: string }) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  recordPayment: (invoiceId: string, p: Omit<Payment, "id">) => void;
  expenses: Expense[];
  addExpense: (e: Omit<Expense, "id">) => void;
  recurring: RecurringProfile[];
  addRecurring: (r: Omit<RecurringProfile, "id">) => void;
  staff: StaffMember[];
  addStaff: (s: Omit<StaffMember, "id">) => void;
  nextInvoiceNumber: (kind: InvoiceKind) => string;
};

const StoreContext = createContext<Store | null>(null);

const initialBusiness: Business = {
  name: "Sharma Traders",
  gstin: "27ABCPS1234F1Z5",
  state: "Maharashtra - 27",
  address: "Shop 14, MG Road, Camp, Pune, Maharashtra 411001",
  phone: "+91 98220 11223",
  email: "accounts@sharmatraders.in",
  bank: { name: "HDFC Bank", account: "5012 3456 7890 12", ifsc: "HDFC0001234", branch: "Camp, Pune" },
};

const seedCustomers: Customer[] = [
  { id: "c1", name: "Modi Electricals", gstin: "27AABCM4521K1Z2", phone: "+91 98765 43210", email: "modi.elec@gmail.com", state: "Maharashtra - 27", address: "Plot 23, Industrial Area, Pimpri, Pune" },
  { id: "c2", name: "Rajesh Hardware Stores", gstin: "27AAFCR9988L1Z8", phone: "+91 99876 12345", email: "rajesh@rhs.in", state: "Maharashtra - 27", address: "Shop 7, FC Road, Pune" },
  { id: "c3", name: "Delhi Power Distributors", gstin: "07AACCD3344M1Z9", phone: "+91 99100 22334", email: "buy@delhipower.in", state: "Delhi - 07", address: "B-44, Karol Bagh, New Delhi" },
  { id: "c4", name: "Sunrise Builders Pvt Ltd", gstin: "27AAACS1112P1Z6", phone: "+91 90220 88990", email: "po@sunrisebuilders.com", state: "Maharashtra - 27", address: "Tower A, Baner, Pune" },
  { id: "c5", name: "Kolhapur Lighting Co.", phone: "+91 90090 11445", state: "Maharashtra - 27", address: "Mahadwar Road, Kolhapur" },
];

const seedProducts: Product[] = [
  { id: "p1", name: 'Havells 1.5mm Copper Wire (90m)', sku: "HVL-WIRE-15", hsn: "8544", price: 2890, unit: "Roll", gst: 18 },
  { id: "p2", name: "Anchor Modular Switch 6A", sku: "ANC-SW-6A", hsn: "8536", price: 75, unit: "Pcs", gst: 18 },
  { id: "p3", name: "Philips LED Bulb 9W", sku: "PHL-LED-9", hsn: "8539", price: 110, unit: "Pcs", gst: 12 },
  { id: "p4", name: "Crompton Ceiling Fan 1200mm", sku: "CRP-FAN-12", hsn: "8414", price: 2450, unit: "Pcs", gst: 18 },
  { id: "p5", name: "Polycab MCB 32A Single Pole", sku: "PLC-MCB-32", hsn: "8536", price: 220, unit: "Pcs", gst: 18 },
  { id: "p6", name: "Finolex PVC Conduit 25mm", sku: "FNX-PVC-25", hsn: "3917", price: 95, unit: "Mtr", gst: 18 },
];

function makeInvoiceItems(items: { p: Product; qty: number }[]): LineItem[] {
  return items.map(({ p, qty }) => ({ productId: p.id, name: p.name, hsn: p.hsn, qty, unit: p.unit, price: p.price, gst: p.gst }));
}

const seedInvoices = (products: Product[]): Invoice[] => [
  {
    id: "i1", number: "ST/26-27/0408", kind: "invoice", customerId: "c1",
    date: addDays(today(), -22), dueDate: addDays(today(), -7),
    items: makeInvoiceItems([{ p: products[0], qty: 5 }, { p: products[4], qty: 20 }]),
    payments: [], status: "Overdue", createdBy: "Rajesh (Owner)",
  },
  {
    id: "i2", number: "ST/26-27/0409", kind: "invoice", customerId: "c2",
    date: addDays(today(), -14), dueDate: addDays(today(), 1),
    items: makeInvoiceItems([{ p: products[1], qty: 100 }, { p: products[2], qty: 50 }]),
    payments: [{ id: "pay1", date: addDays(today(), -10), amount: 5000, mode: "UPI" }],
    status: "Partially Paid", createdBy: "Rahul (Staff)",
  },
  {
    id: "i3", number: "ST/26-27/0410", kind: "invoice", customerId: "c3",
    date: addDays(today(), -9), dueDate: addDays(today(), 6),
    items: makeInvoiceItems([{ p: products[3], qty: 6 }]),
    payments: [], status: "Sent", createdBy: "Rajesh (Owner)",
  },
  {
    id: "i4", number: "ST/26-27/0411", kind: "invoice", customerId: "c4",
    date: addDays(today(), -3), dueDate: addDays(today(), 12),
    items: makeInvoiceItems([{ p: products[5], qty: 200 }, { p: products[1], qty: 60 }]),
    payments: [{ id: "pay2", date: addDays(today(), -1), amount: 27000, mode: "NEFT" }],
    status: "Paid", createdBy: "Priya (Accountant)",
  },
  {
    id: "i5", number: "ST/26-27/0407", kind: "invoice", customerId: "c1",
    date: addDays(today(), -55), dueDate: addDays(today(), -40),
    items: makeInvoiceItems([{ p: products[0], qty: 2 }]),
    payments: [], status: "Overdue", createdBy: "Rajesh (Owner)",
  },
];

const seedExpenses: Expense[] = [
  { id: "e1", name: "Shop Rent - Aug", category: "Rent", date: addDays(today(), -10), amount: 45000, vendor: "Patil Estate", gstEligible: false },
  { id: "e2", name: "Stock Purchase - Polycab", category: "Stock Purchase", date: addDays(today(), -8), amount: 124000, vendor: "Polycab India Ltd", gstEligible: true, gstAmount: 22320 },
  { id: "e3", name: "Electricity Bill", category: "Electricity", date: addDays(today(), -5), amount: 8400, vendor: "MSEDCL", gstEligible: false },
  { id: "e4", name: "Salary - Rahul", category: "Staff Salary", date: addDays(today(), -2), amount: 28000, vendor: "Rahul Pawar", gstEligible: false },
];

const seedStaff: StaffMember[] = [
  { id: "s1", name: "Rajesh Sharma", email: "rajesh@sharmatraders.in", role: "Owner", lastActive: "now" },
  { id: "s2", name: "Priya Deshmukh", email: "priya@sharmatraders.in", role: "Accountant", lastActive: "2h ago" },
  { id: "s3", name: "Rahul Pawar", email: "rahul@sharmatraders.in", role: "Staff", lastActive: "yesterday" },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState(initialBusiness);
  const [currentRole, setCurrentRole] = useState<Role>("Owner");
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(() => seedInvoices(seedProducts));
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [recurring, setRecurring] = useState<RecurringProfile[]>([
    {
      id: "r1", customerId: "c4", frequency: "Monthly",
      items: makeInvoiceItems([{ p: seedProducts[3], qty: 2 }]),
      startDate: addDays(today(), -60), indefinite: true, autoSendWhatsApp: true,
      nextDate: addDays(today(), 5),
    },
  ]);
  const [staff, setStaff] = useState<StaffMember[]>(seedStaff);
  const [invSeq, setInvSeq] = useState({ invoice: 412, quotation: 88, credit_note: 12, debit_note: 4 });

  const nextInvoiceNumber = (kind: InvoiceKind) => {
    const prefix = kind === "invoice" ? "ST/26-27/" : kind === "quotation" ? "QT/26-27/" : kind === "credit_note" ? "CN/26-27/" : "DN/26-27/";
    return prefix + String(invSeq[kind]).padStart(4, "0");
  };

  const value = useMemo<Store>(() => ({
    business, setBusiness, currentRole, setCurrentRole,
    customers,
    addCustomer: (c) => {
      const n = { ...c, id: "c" + (customers.length + 1 + Math.floor(Math.random() * 9999)) };
      setCustomers((x) => [...x, n]); return n;
    },
    products,
    addProduct: (p) => {
      const n = { ...p, id: "p" + (products.length + 1 + Math.floor(Math.random() * 9999)) };
      setProducts((x) => [...x, n]); return n;
    },
    invoices,
    addInvoice: (i) => {
      const kind = i.kind ?? "invoice";
      const number = i.number ?? nextInvoiceNumber(kind);
      const inv: Invoice = {
        id: "i" + Date.now(),
        number, kind, refInvoice: i.refInvoice,
        customerId: i.customerId, date: i.date, dueDate: i.dueDate, items: i.items, notes: i.notes,
        payments: [], status: "Draft",
        createdBy: staff.find((s) => s.role === currentRole)?.name + " (" + currentRole + ")" ?? "Owner",
      };
      setInvoices((x) => [inv, ...x]);
      setInvSeq((s) => ({ ...s, [kind]: s[kind] + 1 }));
      return inv;
    },
    updateInvoice: (id, patch) => setInvoices((x) => x.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    recordPayment: (invoiceId, p) => {
      setInvoices((x) =>
        x.map((i) => {
          if (i.id !== invoiceId) return i;
          const payments = [...i.payments, { ...p, id: "pay" + Date.now() }];
          const total = computeTotals(i.items, customers.find((c) => c.id === i.customerId)?.state, business.state).grand;
          const paid = payments.reduce((s, x) => s + x.amount, 0);
          let status: InvoiceStatus = i.status;
          if (paid >= total) status = "Paid";
          else if (paid > 0) status = "Partially Paid";
          return { ...i, payments, status };
        })
      );
    },
    expenses,
    addExpense: (e) => setExpenses((x) => [{ ...e, id: "e" + Date.now() }, ...x]),
    recurring,
    addRecurring: (r) => setRecurring((x) => [...x, { ...r, id: "r" + Date.now() }]),
    staff,
    addStaff: (s) => setStaff((x) => [...x, { ...s, id: "s" + Date.now() }]),
    nextInvoiceNumber,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [business, currentRole, customers, products, invoices, expenses, recurring, staff, invSeq]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function computeTotals(items: LineItem[], customerState?: string, businessState?: string) {
  const interstate = customerState && businessState && customerState !== businessState;
  let subtotal = 0;
  let cgst = 0, sgst = 0, igst = 0;
  for (const it of items) {
    const line = it.qty * it.price;
    subtotal += line;
    const tax = (line * it.gst) / 100;
    if (interstate) igst += tax;
    else { cgst += tax / 2; sgst += tax / 2; }
  }
  const taxTotal = cgst + sgst + igst;
  const grandRaw = subtotal + taxTotal;
  const grand = Math.round(grandRaw);
  const roundOff = grand - grandRaw;
  return { subtotal, cgst, sgst, igst, taxTotal, grand, roundOff, interstate };
}

export function invoicePaid(inv: Invoice) {
  return inv.payments.reduce((s, p) => s + p.amount, 0);
}

export function rolePermissions(role: Role) {
  return {
    canEdit: role === "Owner" || role === "Staff",
    canDelete: role === "Owner",
    canViewFinancials: role !== "Staff",
    canCreate: role !== "Viewer" && role !== "Accountant",
    canManageStaff: role === "Owner",
  };
}

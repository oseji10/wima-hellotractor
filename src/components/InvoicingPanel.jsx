"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const naira = (v) =>
  v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
const today = () => new Date().toISOString().slice(0, 10);
const arr = (x) => (Array.isArray(x) ? x : []);

const statusTone = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "green";
  if (v === "partial") return "amber";
  if (v === "overdue") return "red";
  if (v === "void") return "gray";
  if (v === "sent") return "blue";
  return "purple"; // draft
};
const Pill = ({ tone = "gray", children }) => (
  <span className={`fin-pill fin-pill--${tone}`}><span className="dot" />{children}</span>
);

const emptyLine = () => ({ description: "", quantity: 1, unit_price: "" });

const InvoicingPanel = ({ userRole, hubs = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hub: "", client_name: "", client_email: "", issue_date: today(), due_date: "", tax_pct: 0, notes: "",
  });
  const [lines, setLines] = useState([emptyLine()]);

  const [detail, setDetail] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", paid_at: today(), method: "transfer", reference: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params = { per_page: 50 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    api.get(`/finance/invoices`, { params })
      .then((r) => setData(arr(r.data?.data ?? r.data)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(load, [load]);

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.quantity || 0) * parseFloat(l.unit_price || 0)), 0);
  const tax = subtotal * (parseFloat(form.tax_pct || 0) / 100);
  const total = subtotal + tax;

  const setLine = (i, k, v) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const delLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const create = async () => {
    if (!form.client_name || lines.some((l) => !l.description)) return;
    setSaving(true);
    try {
      await api.post(`/finance/invoices`, {
        ...form,
        hub: form.hub || null,
        due_date: form.due_date || null,
        tax_pct: parseFloat(form.tax_pct || 0),
        items: lines.map((l) => ({
          description: l.description,
          quantity: parseFloat(l.quantity || 0),
          unit_price: parseFloat(l.unit_price || 0),
        })),
      });
      setForm({ hub: "", client_name: "", client_email: "", issue_date: today(), due_date: "", tax_pct: 0, notes: "" });
      setLines([emptyLine()]);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const openDetail = async (inv) => {
    const r = await api.get(`/finance/invoices/${inv.id}`);
    setDetail(r.data);
    setPayForm({ amount: r.data.balance || "", paid_at: today(), method: "transfer", reference: "" });
  };

  const recordPayment = async () => {
    if (!payForm.amount) return;
    const r = await api.post(`/finance/invoices/${detail.id}/payments`, {
      ...payForm, amount: parseFloat(payForm.amount),
    });
    setDetail(r.data);
    setPayForm({ amount: "", paid_at: today(), method: "transfer", reference: "" });
    load();
  };

  const voidInvoice = async () => {
    if (!confirm("Void this invoice?")) return;
    await api.put(`/finance/invoices/${detail.id}/void`);
    setDetail(null);
    load();
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="form-label small text-muted">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["draft", "sent", "partial", "paid", "overdue", "void"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <label className="form-label small text-muted">Search</label>
          <input className="form-control" placeholder="Client or invoice #…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="col-12 col-md-5 d-flex align-items-end justify-content-md-end">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Icon icon="solar:bill-list-bold" width={17} className="me-1" style={{ verticalAlign: "-3px" }} /> New invoice
          </button>
        </div>
      </div>

      <div className="fin-card">
        <div className="table-responsive">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th>
                <th className="fin-num">Total</th><th className="fin-num">Balance</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="fin-empty">No invoices yet.</td></tr>
              ) : data.map((inv) => (
                <tr key={inv.id} className="clickable" onClick={() => openDetail(inv)}>
                  <td className="font-monospace small">{inv.invoice_number}</td>
                  <td className="fw-medium">{inv.client_name}</td>
                  <td className="small text-muted">{inv.issue_date}</td>
                  <td className="small text-muted">{inv.due_date || "—"}</td>
                  <td className="fin-num">{naira(inv.total)}</td>
                  <td className="fin-num fw-semibold">{naira(inv.balance)}</td>
                  <td><Pill tone={statusTone(inv.computed_status)}>{inv.computed_status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">New invoice</h5>
                <button className="btn-close" onClick={() => setShowForm(false)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-2">
                  <div className="col-md-6">
                    <label className="form-label">Client name *</label>
                    <input className="form-control" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Client email</label>
                    <input className="form-control" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Hub</label>
                    <select className="form-select" value={form.hub} onChange={(e) => setForm({ ...form, hub: e.target.value })}>
                      <option value="">N/A</option>
                      {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Issue date</label>
                    <input type="date" className="form-control" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Due date</label>
                    <input type="date" className="form-control" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Tax %</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })} />
                  </div>
                </div>

                <label className="form-label">Line items</label>
                {lines.map((l, i) => (
                  <div className="fin-line-row" key={i}>
                    <input className="form-control form-control-sm" placeholder="Description" value={l.description} onChange={(e) => setLine(i, "description", e.target.value)} />
                    <input type="number" min="0" className="form-control form-control-sm" placeholder="Qty" value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} />
                    <input type="number" min="0" step="0.01" className="form-control form-control-sm" placeholder="Unit ₦" value={l.unit_price} onChange={(e) => setLine(i, "unit_price", e.target.value)} />
                    <div className="form-control form-control-sm fin-num bg-light">{naira(parseFloat(l.quantity || 0) * parseFloat(l.unit_price || 0))}</div>
                    <button className="btn btn-sm btn-link text-danger p-0" onClick={() => delLine(i)}><Icon icon="solar:close-circle-outline" width={18} /></button>
                  </div>
                ))}
                <button className="btn btn-sm btn-light" onClick={addLine}><Icon icon="solar:add-circle-outline" width={15} className="me-1" /> Add line</button>

                <div className="d-flex flex-column align-items-end mt-3 gap-1">
                  <div className="small text-muted">Subtotal: {naira(subtotal)}</div>
                  <div className="small text-muted">Tax: {naira(tax)}</div>
                  <div className="fw-bold">Total: {naira(total)}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={create} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null} Create invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail / payment modal */}
      {detail && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">{detail.invoice_number}</h5>
                  <div className="small text-muted">{detail.client_name}{detail.client_email ? ` · ${detail.client_email}` : ""}</div>
                </div>
                <button className="btn-close" onClick={() => setDetail(null)} />
              </div>
              <div className="modal-body">
                <div className="d-flex gap-2 mb-3">
                  <Pill tone={statusTone(detail.computed_status)}>{detail.computed_status}</Pill>
                  <span className="small text-muted">Issued {detail.issue_date}{detail.due_date ? ` · due ${detail.due_date}` : ""}</span>
                </div>

                <table className="fin-table mb-3">
                  <thead><tr><th>Item</th><th className="fin-num">Qty</th><th className="fin-num">Unit</th><th className="fin-num">Amount</th></tr></thead>
                  <tbody>
                    {arr(detail.items).map((it) => (
                      <tr key={it.id}><td>{it.description}</td><td className="fin-num">{it.quantity}</td><td className="fin-num">{naira(it.unit_price)}</td><td className="fin-num">{naira(it.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-flex flex-column align-items-end gap-1 mb-3">
                  <div className="small text-muted">Subtotal: {naira(detail.subtotal)}</div>
                  <div className="small text-muted">Tax ({detail.tax_pct}%): {naira(detail.tax_amount)}</div>
                  <div className="fw-bold">Total: {naira(detail.total)}</div>
                  <div className="small">Paid: {naira(detail.amount_paid)} · <span className="fw-semibold">Balance: {naira(detail.balance)}</span></div>
                </div>

                {arr(detail.payments).length > 0 && (
                  <>
                    <div className="small fw-semibold text-muted mb-1">PAYMENTS</div>
                    {arr(detail.payments).map((p) => (
                      <div key={p.id} className="d-flex justify-content-between small py-1 border-bottom">
                        <span>{p.paid_at} · {p.method || "—"}{p.reference ? ` · ${p.reference}` : ""}</span>
                        <span className="fw-medium">{naira(p.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {detail.computed_status !== "paid" && detail.computed_status !== "void" && (
                  <div className="fin-card fin-card-pad mt-3" style={{ background: "var(--fin-bg-soft)" }}>
                    <div className="small fw-semibold mb-2">Record payment</div>
                    <div className="row g-2">
                      <div className="col-md-3">
                        <input type="number" min="0" step="0.01" className="form-control form-control-sm" placeholder="Amount" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                      </div>
                      <div className="col-md-3">
                        <input type="date" className="form-control form-control-sm" value={payForm.paid_at} onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })} />
                      </div>
                      <div className="col-md-3">
                        <select className="form-select form-select-sm" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                          {["transfer", "cash", "card", "cheque"].map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <input className="form-control form-control-sm" placeholder="Reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
                      </div>
                    </div>
                    <div className="text-end mt-2">
                      <button className="btn btn-sm btn-success" onClick={recordPayment}>Record payment</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {detail.computed_status !== "void" && <button className="btn btn-outline-danger me-auto" onClick={voidInvoice}>Void</button>}
                <button className="btn btn-light" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoicingPanel;
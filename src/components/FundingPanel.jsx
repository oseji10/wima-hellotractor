"use client";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import api from "../../lib/api";

const naira = (v) =>
  v || v === 0 ? `₦${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
const today = () => new Date().toISOString().slice(0, 10);
const arr = (x) => (Array.isArray(x) ? x : []);

const typeTone = { donor: "blue", grant: "purple", investment: "green" };
const statusTone = { active: "green", pledged: "amber", closed: "gray" };
const Pill = ({ tone = "gray", children }) => (
  <span className={`fin-pill fin-pill--${tone}`}><span className="dot" />{children}</span>
);

const FundingPanel = ({ userRole }) => {
  const canManage = userRole === "ADMIN" || userRole === "National Coordinator";
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "donor", organization: "", contact_email: "", currency: "NGN",
    total_committed: "", start_date: today(), end_date: "", status: "active",
    purpose: "", equity_pct: "", expected_return_pct: "", notes: "",
  });
  const [detail, setDetail] = useState(null);
  const [txn, setTxn] = useState({ type: "disbursement", amount: "", transaction_date: today(), reference: "", notes: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    api.get(`/finance/funding`, { params })
      .then((r) => setSources(arr(r.data)))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { if (canManage) load(); else setLoading(false); }, [load, canManage]);

  const create = async () => {
    if (!form.name || !form.total_committed) return;
    setSaving(true);
    try {
      await api.post(`/finance/funding`, {
        ...form,
        total_committed: parseFloat(form.total_committed),
        equity_pct: form.equity_pct ? parseFloat(form.equity_pct) : null,
        expected_return_pct: form.expected_return_pct ? parseFloat(form.expected_return_pct) : null,
        end_date: form.end_date || null,
      });
      setShowForm(false);
      setForm({ name: "", type: "donor", organization: "", contact_email: "", currency: "NGN", total_committed: "", start_date: today(), end_date: "", status: "active", purpose: "", equity_pct: "", expected_return_pct: "", notes: "" });
      load();
    } finally { setSaving(false); }
  };

  const openDetail = async (s) => {
    const r = await api.get(`/finance/funding/${s.id}`);
    setDetail(r.data);
    setTxn({ type: "disbursement", amount: "", transaction_date: today(), reference: "", notes: "" });
  };

  const addTxn = async () => {
    if (!txn.amount) return;
    const r = await api.post(`/finance/funding/${detail.id}/transactions`, { ...txn, amount: parseFloat(txn.amount) });
    // refresh detail with the returned source + reload its transactions
    const fresh = await api.get(`/finance/funding/${detail.id}`);
    setDetail(fresh.data);
    setTxn({ type: "disbursement", amount: "", transaction_date: today(), reference: "", notes: "" });
    load();
  };

  if (!canManage) {
    return <div className="fin-empty">Funding tracking is available to administrators and national coordinators.</div>;
  }

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <label className="form-label small text-muted">Type</label>
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            {["donor", "grant", "investment"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-9 d-flex align-items-end justify-content-md-end">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Icon icon="solar:hand-money-bold" width={17} className="me-1" style={{ verticalAlign: "-3px" }} /> Add funding source
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : sources.length === 0 ? (
        <div className="fin-card"><div className="fin-empty">No funding sources yet.</div></div>
      ) : (
        <div className="row g-3">
          {sources.map((s) => (
            <div className="col-md-6 col-lg-4" key={s.id}>
              <div className="fin-card fin-card-pad h-100" role="button" onClick={() => openDetail(s)}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold">{s.name}</div>
                    <div className="small text-muted">{s.organization || "—"}</div>
                  </div>
                  <Pill tone={typeTone[s.type] || "gray"}>{s.type}</Pill>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Committed</span><span className="fw-semibold">{naira(s.total_committed)}</span>
                </div>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">Received</span><span>{naira(s.total_received)} ({s.pct_received}%)</span>
                </div>
                <div className="fin-progress mb-2"><span style={{ width: `${Math.min(100, s.pct_received)}%` }} /></div>
                <div className="d-flex justify-content-between align-items-center">
                  <Pill tone={statusTone[s.status] || "gray"}>{s.status}</Pill>
                  <span className="small text-muted">Bal {naira(s.balance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add source modal */}
      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <h5 className="modal-title">Add funding source</h5>
                <button className="btn-close" onClick={() => setShowForm(false)} disabled={saving} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name *</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {["donor", "grant", "investment"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {["active", "pledged", "closed"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Organization</label>
                    <input className="form-control" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact email</label>
                    <input className="form-control" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Total committed *</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.total_committed} onChange={(e) => setForm({ ...form, total_committed: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Start date</label>
                    <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End date</label>
                    <input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                  {form.type === "investment" && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">Equity %</label>
                        <input type="number" min="0" step="0.01" className="form-control" value={form.equity_pct} onChange={(e) => setForm({ ...form, equity_pct: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Expected return %</label>
                        <input type="number" min="0" step="0.01" className="form-control" value={form.expected_return_pct} onChange={(e) => setForm({ ...form, expected_return_pct: e.target.value })} />
                      </div>
                    </>
                  )}
                  {form.type === "grant" && (
                    <div className="col-12">
                      <label className="form-label">Restricted purpose</label>
                      <input className="form-control" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={create} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail + transactions modal */}
      {detail && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(16,24,40,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">{detail.name}</h5>
                  <div className="small text-muted">{detail.organization || "—"} · <Pill tone={typeTone[detail.type]}>{detail.type}</Pill></div>
                </div>
                <button className="btn-close" onClick={() => setDetail(null)} />
              </div>
              <div className="modal-body">
                <div className="fin-share-grid">
                  <div className="fin-share"><div className="v">{naira(detail.total_committed)}</div><div className="l">Committed</div></div>
                  <div className="fin-share"><div className="v">{naira(detail.total_received)}</div><div className="l">Received</div></div>
                  <div className="fin-share"><div className="v">{naira(detail.balance)}</div><div className="l">Balance</div></div>
                  <div className="fin-share"><div className="v">{detail.pct_received}%</div><div className="l">Drawn down</div></div>
                </div>

                {detail.purpose && <div className="small mb-2"><span className="text-muted">Purpose:</span> {detail.purpose}</div>}
                {detail.type === "investment" && (
                  <div className="small mb-2 text-muted">
                    Equity {detail.equity_pct ?? "—"}% · Expected return {detail.expected_return_pct ?? "—"}%
                  </div>
                )}

                <div className="small fw-semibold text-muted mb-1 mt-2">TRANSACTIONS</div>
                {arr(detail.transactions).length === 0 ? (
                  <div className="fin-empty">No transactions recorded.</div>
                ) : arr(detail.transactions).map((t) => (
                  <div key={t.id} className="d-flex justify-content-between small py-1 border-bottom">
                    <span><Pill tone={t.type === "disbursement" ? "green" : t.type === "expense" ? "red" : "blue"}>{t.type.replace("_", " ")}</Pill> {t.transaction_date}{t.reference ? ` · ${t.reference}` : ""}</span>
                    <span className="fw-medium">{naira(t.amount)}</span>
                  </div>
                ))}

                <div className="fin-card fin-card-pad mt-3" style={{ background: "var(--fin-bg-soft)" }}>
                  <div className="small fw-semibold mb-2">Add transaction</div>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <select className="form-select form-select-sm" value={txn.type} onChange={(e) => setTxn({ ...txn, type: e.target.value })}>
                        {["pledge", "disbursement", "expense", "return_payout"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input type="number" min="0" step="0.01" className="form-control form-control-sm" placeholder="Amount" value={txn.amount} onChange={(e) => setTxn({ ...txn, amount: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <input type="date" className="form-control form-control-sm" value={txn.transaction_date} onChange={(e) => setTxn({ ...txn, transaction_date: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <input className="form-control form-control-sm" placeholder="Reference" value={txn.reference} onChange={(e) => setTxn({ ...txn, reference: e.target.value })} />
                    </div>
                  </div>
                  <div className="text-end mt-2">
                    <button className="btn btn-sm btn-success" onClick={addTxn}>Add</button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setDetail(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FundingPanel;
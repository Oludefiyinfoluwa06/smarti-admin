"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { deleteCookie } from "@/lib/actions";
import { fetchPayments, FetchPaymentsResult, PaymentRecord } from "@/lib/api/payments";
import { redirect } from "next/navigation";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const limit = 12;
        const resp: FetchPaymentsResult = await fetchPayments({ page, limit });
        if (!mounted) return;
        setPayments(resp.items || []);
        setTotal(resp.total || 0);
        setTotalPages(resp.totalPages || 0);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          deleteCookie("smartiAdminToken");
          redirect('/login');
          return;
        }
        console.error('Failed to load payments', err);
        setError(err?.response?.data?.error ?? err?.message ?? 'Failed to load payments');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(p => [p.reference, p.email, p.payerName, p.method, p.status]
      .filter(Boolean)
      .some(v => (v as string).toLowerCase().includes(q))
    );
  }, [payments, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500">Admin panel — {loading ? 'loading...' : `${total} payment${total === 1 ? '' : 's'}`}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payments..."
              className="w-64 rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border-l-4 border-rose-400 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Reference</th>
              <th className="text-left font-medium px-4 py-3">Email</th>
              <th className="text-left font-medium px-4 py-3">Amount</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Method</th>
              <th className="text-left font-medium px-4 py-3">Date</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                  <div className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading payments...</div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No payments found.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id || p.reference} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.reference}</td>
                  <td className="px-4 py-3">{p.email}</td>
                  <td className="px-4 py-3 text-slate-900">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                      ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : ''}
                      ${p.status === 'pending' ? 'bg-slate-100 text-slate-700' : ''}
                      ${p.status === 'failed' ? 'bg-rose-50 text-rose-700' : ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.method ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd') : ''}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelected(p)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">
                        <Eye className="h-4 w-4" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination simple */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Showing page {page} of {totalPages || 1}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border">Prev</button>
          <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-md border">Next</button>
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-w-xl w-full bg-white rounded-md shadow-lg p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Payment {selected.reference}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
              <div><strong>Amount:</strong> ₦{Number(selected.amount).toLocaleString()}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Payer:</strong> {selected.payerName ?? '-'}</div>
              <div><strong>Method:</strong> {selected.method ?? '-'}</div>
              <div><strong>Reference:</strong> {selected.reference}</div>
              <div><strong>Date:</strong> {selected.createdAt ? format(new Date(selected.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

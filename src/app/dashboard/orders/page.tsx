"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Search,
  X,
  Truck,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { deleteCookie } from "@/lib/actions";
import {
  fetchOrders,
  FetchOrdersResult,
  Order,
  OrderStatus,
  updateOrderStatus,
} from "@/lib/api/orders";

const PAGE_BUTTON_LIMIT = 7; // when to show numeric page buttons

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus | "All">("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const limit = 10;
        const opts: any = { page, limit };
        if (statusFilter && statusFilter !== "All") opts.status = statusFilter;
        const resp: FetchOrdersResult = await fetchOrders(opts);
        if (!isMounted) return;
        setOrders(resp.items);
        setTotal(resp.total);
        setTotalPages(resp.totalPages ?? (resp.limit ? Math.ceil(resp.total / resp.limit) : 0));
      } catch (err: any) {
        if (err?.response?.status === 401) {
          deleteCookie("smartiAdminToken");
          redirect("/login");
          return;
        }
        console.error("Failed to load orders", err);
        if (isMounted) {
          setError(
            err?.response?.data?.error ??
              err?.response?.data?.message ??
              "Failed to load orders. Check console for details."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.id, o.customer, o.email, o.status, o.total, o.orderId]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [orders, query]);

  function updateStatusLocal(id: string, status: Order["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const isActionEnabled = (
    actionKey: "accept" | "decline" | "ship" | "deliver",
    status: Order["status"]
  ) => {
    switch (actionKey) {
      case "accept":
      case "decline":
        return status === "Pending";
      case "ship":
        return status === "Accepted";
      case "deliver":
        return status === "Shipped";
      default:
        return false;
    }
  };

  async function changeStatusRemote(
    id: string,
    status: Order["status"],
    actionKey: "accept" | "decline" | "ship" | "deliver"
  ) {
    setBusyId(id);
    setBusyAction(actionKey);
    setError(null);

    try {
      await updateOrderStatus(id, status);
      updateStatusLocal(id, status);
    } catch (err: any) {
      console.error("Failed to update status:", err?.response?.data ?? err.message ?? err);
      setError(err?.response?.data?.error ?? "Failed to update order status.");
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleAccept(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order || !isActionEnabled("accept", order.status)) return;
    await changeStatusRemote(id, "Accepted", "accept");
  }

  async function handleDecline(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order || !isActionEnabled("decline", order.status)) return;
    await changeStatusRemote(id, "Declined", "decline");
  }

  async function handleShip(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order || !isActionEnabled("ship", order.status)) return;
    await changeStatusRemote(id, "Shipped", "ship");
  }

  async function handleDeliver(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order || !isActionEnabled("deliver", order.status)) return;
    await changeStatusRemote(id, "Delivered", "deliver");
  }

  const goPrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const goNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // helper to show page buttons (centered around current page)
  function renderPageButtons() {
    if (totalPages <= 1) return null;
    // show all pages when small count
    if (totalPages <= PAGE_BUTTON_LIMIT) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`inline-flex items-center justify-center min-w-[34px] h-8 rounded-md px-2 text-xs border ${
            p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          {p}
        </button>
      ));
    }

    // otherwise show truncated window: [1] ... [p-1] [p] [p+1] ... [last]
    const pages: (number | "...")[] = [];
    pages.push(1);

    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`dots-${idx}`} className="inline-flex items-center justify-center min-w-[34px] h-8 text-xs text-slate-500">
          ...
        </span>
      ) : (
        <button
          key={p}
          onClick={() => setPage(p as number)}
          className={`inline-flex items-center justify-center min-w-[34px] h-8 rounded-md px-2 text-xs border ${
            p === page ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          {p}
        </button>
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500">
            Admin panel — {loading ? "loading..." : `${total} order${total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-64 rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value as any;
              setStatusFilter(v === "All" ? "All" : v === "" ? "" : (v as OrderStatus));
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border-l-4 border-rose-400 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Order</th>
              <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3">School</th>
              <th className="text-left font-medium px-4 py-3">Email</th>
              <th className="text-left font-medium px-4 py-3">Total</th>
              <th className="text-left font-medium px-4 py-3">Date</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                  No orders found.
                </td>
              </tr>
              ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedOrder(o)}>
                  <td className="px-4 py-3 font-medium text-slate-900">{o.orderId}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3 text-slate-600">{o.school ?? ""}</td>
                  <td className="px-4 py-3 text-slate-600">{o.email}</td>
                  <td className="px-4 py-3 text-slate-900">{o.total}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.date ? format(new Date(o.date), "yyyy-MM-dd") : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                        ${o.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : ""}
                        ${o.status === "Shipped" ? "bg-blue-50 text-blue-700" : ""}
                        ${o.status === "Processing" ? "bg-amber-50 text-amber-700" : ""}
                        ${o.status === "Pending" ? "bg-slate-100 text-slate-700" : ""}
                        ${o.status === "Declined" ? "bg-rose-50 text-rose-700" : ""}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {(o.status === "Pending" || o.status === "Declined") && (
                        <>
                          <button
                            onClick={() => handleAccept(o.id)}
                            disabled={busyId === o.id || !isActionEnabled("accept", o.status)}
                            aria-disabled={!isActionEnabled("accept", o.status)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 text-emerald-700 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {busyId === o.id && busyAction === "accept" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Accept
                          </button>

                          <button
                            onClick={() => handleDecline(o.id)}
                            disabled={busyId === o.id || !isActionEnabled("decline", o.status)}
                            aria-disabled={!isActionEnabled("decline", o.status)}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 text-rose-600 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50 disabled:opacity-60"
                          >
                            {busyId === o.id && busyAction === "decline" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Decline
                          </button>
                        </>
                      )}

                      {o.status === "Accepted" && (
                        <button
                          onClick={() => handleShip(o.id)}
                          disabled={busyId === o.id || !isActionEnabled("ship", o.status)}
                          aria-disabled={!isActionEnabled("ship", o.status)}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 text-sky-700 px-2.5 py-1.5 text-xs font-medium hover:bg-sky-50 disabled:opacity-60"
                        >
                          {busyId === o.id && busyAction === "ship" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Truck className="h-4 w-4" />
                          )}
                          Mark as Shipped
                        </button>
                      )}

                      {o.status === "Shipped" && (
                        <button
                          onClick={() => handleDeliver(o.id)}
                          disabled={busyId === o.id || !isActionEnabled("deliver", o.status)}
                          aria-disabled={!isActionEnabled("deliver", o.status)}
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 text-indigo-700 px-2.5 py-1.5 text-xs font-medium hover:bg-indigo-50 disabled:opacity-60"
                        >
                          {busyId === o.id && busyAction === "deliver" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                          Mark as Delivered
                        </button>
                      )}

                      {o.status === "Delivered" && (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          Delivered
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Order details modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />
            <div className="relative z-10 max-w-xl w-full bg-white rounded-md shadow-lg p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">Order {selectedOrder.orderId}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500">Close</button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div><strong>Customer:</strong> {selectedOrder.customer}</div>
                <div><strong>School:</strong> {selectedOrder.school ?? "-"}</div>
                <div><strong>Email:</strong> {selectedOrder.email}</div>
                <div><strong>Total:</strong> {selectedOrder.total}</div>
                <div><strong>Date:</strong> {selectedOrder.date ? format(new Date(selectedOrder.date), "yyyy-MM-dd HH:mm") : "-"}</div>
                <div><strong>Status:</strong> {selectedOrder.status}</div>
                <div><strong>Packages:</strong> {selectedOrder.packageSummary ?? "-"}</div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 rounded-md bg-slate-100">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            <div className="flex items-center gap-1">
              {renderPageButtons()}
            </div>

            <button
              onClick={goNext}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages || 1}</span>
            </div>

            <div className="text-sm text-slate-500">
              {total ? `${total} total` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

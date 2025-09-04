"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Check, X, Truck, Package } from "lucide-react";
import { fetchOrders, Order, updateOrderStatus } from "@/lib/api/orders";
import { fetchDrafts, Draft, getSubscribersCount } from "@/lib/api/newsletter";
import ActionBtn from "@/components/dashboard/ActiveBtn";
import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Request exactly 3 orders
        let ordersResp: any;
        try {
          ordersResp = await fetchOrders({ page: 1, limit: 3 });
        } catch (e) {
          // fallback: maybe fetchOrders still returns an array without params
          console.warn("fetchOrders with opts failed, falling back to default call", e);
          ordersResp = await fetchOrders();
        }

        // Normalize orders response
        let ordersItems: Order[] = [];
        if (Array.isArray(ordersResp)) {
          ordersItems = ordersResp;
        } else if (Array.isArray((ordersResp as any).items)) {
          ordersItems = (ordersResp as any).items;
        } else if (Array.isArray((ordersResp as any).data)) {
          ordersItems = (ordersResp as any).data;
        } else {
          ordersItems = [];
        }

        // Request exactly 3 drafts
        let draftsResp: any;
        try {
          draftsResp = await fetchDrafts(1, 3);
        } catch (e) {
          console.warn("fetchDrafts with params failed, falling back to default call", e);
          draftsResp = await fetchDrafts();
        }

        // Normalize drafts response
        let draftItems: Draft[] = [];
        if (Array.isArray(draftsResp)) {
          draftItems = draftsResp;
        } else if (Array.isArray((draftsResp as any).data)) {
          draftItems = (draftsResp as any).data;
        } else if (Array.isArray((draftsResp as any).items)) {
          draftItems = (draftsResp as any).items;
        } else {
          draftItems = [];
        }

        const subCount = await getSubscribersCount();

        setSubscribersCount(subCount);
        setOrders(ordersItems);
        setDrafts(draftItems.slice(0, 3)); // safety: ensure 3 max
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function changeStatus(id: string, status: Order["status"]) {
    setBusyId(id);
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight mb-4">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Orders" value={orders.length.toLocaleString()} />
          <StatCard
            title="Pending"
            value={orders.filter((o) => o.status === "Pending").length.toString()}
          />
          <StatCard
            title="Revenue"
            value={`₦ ${orders
              .reduce(
                (sum, o) => sum + parseFloat(o.total.replace(/[^0-9.-]+/g, "")),
                0
              )
              .toLocaleString()}`}
          />
          <StatCard title="Subscribers" value={subscribersCount.toLocaleString()} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-slate-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="p-5 text-sm text-slate-600">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-200">
                    {orders.slice(0, 3).map((o) => (
                      <tr key={o.id} className="border-b">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {o.orderId}
                        </td>
                        <td className="px-3 py-2 text-slate-500 sm:table-cell">{o.customer}</td>
                        <td className="px-3 py-2 text-slate-900">{o.total}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 flex gap-2">
                          {o.status === "Pending" && (
                            <>
                              <ActionBtn
                                label="Accept"
                                icon={<Check className="h-4 w-4" />}
                                busy={busyId === o.id}
                                onClick={() => changeStatus(o.id, "Accepted")}
                              />
                              <ActionBtn
                                label="Decline"
                                icon={<X className="h-4 w-4" />}
                                busy={busyId === o.id}
                                onClick={() => changeStatus(o.id, "Declined")}
                              />
                            </>
                          )}
                          {o.status === "Accepted" && (
                            <ActionBtn
                              label="Mark Shipped"
                              icon={<Truck className="h-4 w-4" />}
                              busy={busyId === o.id}
                              onClick={() => changeStatus(o.id, "Shipped")}
                            />
                          )}
                          {o.status === "Shipped" && (
                            <ActionBtn
                              label="Mark Delivered"
                              icon={<Package className="h-4 w-4" />}
                              busy={busyId === o.id}
                              onClick={() => changeStatus(o.id, "Delivered")}
                            />
                          )}
                        </td>
                      </tr>
                    ))}

                    {orders.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-600">
                          No recent orders.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold">Newsletter Drafts</h2>
            <Link
              href="/dashboard/newsletter"
              className="text-sm text-slate-700 hover:underline"
            >
              Open
            </Link>
          </div>
          <div className="p-5 text-sm text-slate-600">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : drafts.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {drafts.slice(0, 3).map((d) => (
                  <li key={d.draftId}>{d.title || "Untitled Draft"}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No drafts available.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

import axios from "axios";
import { getCookie } from "../actions";

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Accepted"
  | "Declined";

export type Order = {
  id: string;
  customer: string;
  email: string;
  total: string;
  date: string;
  orderId: string;
  status: OrderStatus;
  [k: string]: any;
};

const BASE = process.env.NEXT_PUBLIC_BASE_API_URL;

async function getAuthHeaders() {
  const authToken = await getCookie("smartiAdminToken");
  return { Authorization: `Bearer ${authToken?.value}` };
}

export type FetchOrdersOpts = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
};

export type FetchOrdersResult = {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchOrders(opts?: FetchOrdersOpts): Promise<FetchOrdersResult> {
  const headers = await getAuthHeaders();
  const params: any = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;
  if (opts?.status) params.status = opts.status;

  const resp = await axios.get(`${BASE}/orders`, { headers, params });

  const data = resp.data;

  if (Array.isArray(data)) {
    const items = data as Order[];
    const limit = opts?.limit ?? items.length;
    const page = opts?.page ?? 1;
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.items)) {
    const items = data.items as Order[];
    const total = Number(data.total ?? data.meta?.total ?? items.length);
    const page = Number(data.page ?? data.meta?.page ?? opts?.page ?? 1);
    const limit = Number(data.limit ?? data.meta?.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.totalPages ?? data.meta?.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.data)) {
    const items = data.data as Order[];
    const total = Number(data.meta?.total ?? data.total ?? items.length);
    const page = Number(data.meta?.page ?? data.page ?? opts?.page ?? 1);
    const limit = Number(data.meta?.limit ?? data.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.meta?.totalPages ?? data.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 50, totalPages: 0 };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const headers = await getAuthHeaders();
  await axios.put(
    `${BASE}/orders/${id}/status`,
    { status },
    { headers: { ...headers, "Content-Type": "application/json" } }
  );
}

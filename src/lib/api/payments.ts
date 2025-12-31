import axios from "axios";
import { getCookie } from "../actions";

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled" | string;

export type PaymentRecord = {
  _id?: string;
  payerName?: string;
  email: string;
  phone?: string;
  amount: number;
  currency?: string;
  reference: string;
  status: PaymentStatus;
  method?: string;
  createdAt?: string;
  meta?: any;
  [k: string]: any;
};

const BASE = process.env.NEXT_PUBLIC_BASE_API_URL;

async function getAuthHeaders() {
  const authToken = await getCookie("smartiAdminToken");
  return { Authorization: `Bearer ${authToken?.value}` };
}

export type FetchPaymentsOpts = {
  page?: number;
  limit?: number;
};

export type FetchPaymentsResult = {
  items: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchPayments(opts?: FetchPaymentsOpts): Promise<FetchPaymentsResult> {
  const headers = await getAuthHeaders();
  const params: any = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;

  const resp = await axios.get(`${BASE}/payments`, { headers, params });

  const data = resp.data;

  if (Array.isArray(data)) {
    const items = data as PaymentRecord[];
    const limit = opts?.limit ?? items.length;
    const page = opts?.page ?? 1;
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.items)) {
    const items = data.items as PaymentRecord[];
    const total = Number(data.total ?? data.meta?.total ?? items.length);
    const page = Number(data.page ?? data.meta?.page ?? opts?.page ?? 1);
    const limit = Number(data.limit ?? data.meta?.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.totalPages ?? data.meta?.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.data)) {
    const items = data.data as PaymentRecord[];
    const total = Number(data.meta?.total ?? data.total ?? items.length);
    const page = Number(data.meta?.page ?? data.page ?? opts?.page ?? 1);
    const limit = Number(data.meta?.limit ?? data.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.meta?.totalPages ?? data.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 50, totalPages: 0 };
}

export async function getPayment(id: string) {
  const headers = await getAuthHeaders();
  const resp = await axios.get(`${BASE}/payments/${id}`, { headers });
  return resp.data as PaymentRecord;
}

import axios from "axios";
import { getCookie } from "../actions";

export type Draft = {
  _id?: string;
  draftId: string;
  title: string;
  content: string;
  updatedAt?: string;
  [k: string]: any;
};

export type DraftsResponse = {
  data: Draft[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_BASE_API_URL;

async function getAuthHeaders() {
  const authToken = await getCookie("smartiAdminToken");
  return { Authorization: `Bearer ${authToken?.value}` };
}

export async function fetchDrafts(page = 1, limit = 10): Promise<DraftsResponse> {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/newsletter`, {
    headers,
    params: { page, limit },
  });

  const payload = res.data;

  if (Array.isArray(payload)) {
    const items = payload as Draft[];
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  if (Array.isArray(payload.data)) {
    const items = payload.data as Draft[];
    const meta = payload.meta || {};
    return {
      data: items,
      meta: {
        total: Number(meta.total ?? items.length),
        page: Number(meta.page ?? page),
        limit: Number(meta.limit ?? limit),
        totalPages: Number(meta.totalPages ?? Math.ceil((meta.total ?? items.length) / limit)),
      },
    };
  }

  if (Array.isArray(payload.items)) {
    const items = payload.items as Draft[];
    const meta = payload.meta || {};
    return {
      data: items,
      meta: {
        total: Number(meta.total ?? items.length),
        page: Number(meta.page ?? page),
        limit: Number(meta.limit ?? limit),
        totalPages: Number(meta.totalPages ?? Math.ceil((meta.total ?? items.length) / limit)),
      },
    };
  }

  return {
    data: [],
    meta: { total: 0, page, limit, totalPages: 0 },
  };
}

export async function saveDraft(draft: Draft): Promise<Draft> {
  const headers = await getAuthHeaders();
  const res = await axios.put(`${API_BASE}/newsletter/${draft._id}`, draft, {
    headers: { ...headers, "Content-Type": "application/json" },
  });

  return res.data;
};

export async function sendNewsletter(draft: Draft): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/newsletter/${draft._id}`, {}, {
    headers: { ...headers },
  });

  return res.data;
};

export async function createDraft(draft: Draft): Promise<Draft> {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/newsletter`, draft, {
    headers: { ...headers, "Content-Type": "application/json" },
  });

  return res.data;
};

export async function deleteDraft(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${API_BASE}/newsletter/${id}`, { headers });

  return res.data;
};

export async function getSubscribersCount(): Promise<number> {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/newsletter/subscription/count`, { headers });

  return res.data?.count ?? 0;
}

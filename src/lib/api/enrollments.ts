import axios from "axios";
import { getCookie } from "../actions";

export type CourseItem = { courseId: string; courseTitle?: string; qty: number };

export type EnrollmentRecord = {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  courseItems: CourseItem[];
  totalAmount: number;
  paymentReference?: string;
  paymentStatus?: string;
  createdAt?: string;
  [k: string]: any;
};

const BASE = process.env.NEXT_PUBLIC_BASE_API_URL;

async function getAuthHeaders() {
  const authToken = await getCookie("smartiAdminToken");
  return { Authorization: `Bearer ${authToken?.value}` };
}

export type FetchEnrollmentsOpts = { page?: number; limit?: number };

export type FetchEnrollmentsResult = { items: EnrollmentRecord[]; total: number; page: number; limit: number; totalPages: number };

export async function fetchEnrollments(opts?: FetchEnrollmentsOpts): Promise<FetchEnrollmentsResult> {
  const headers = await getAuthHeaders();
  const params: any = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;

  const resp = await axios.get(`${BASE}/enrollments`, { headers, params });
  const data = resp.data;

  if (Array.isArray(data)) {
    const items = data as EnrollmentRecord[];
    const limit = opts?.limit ?? items.length;
    const page = opts?.page ?? 1;
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.items)) {
    const items = data.items as EnrollmentRecord[];
    const total = Number(data.total ?? data.meta?.total ?? items.length);
    const page = Number(data.page ?? data.meta?.page ?? opts?.page ?? 1);
    const limit = Number(data.limit ?? data.meta?.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.totalPages ?? data.meta?.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  if (Array.isArray(data.data)) {
    const items = data.data as EnrollmentRecord[];
    const total = Number(data.meta?.total ?? data.total ?? items.length);
    const page = Number(data.meta?.page ?? data.page ?? opts?.page ?? 1);
    const limit = Number(data.meta?.limit ?? data.limit ?? opts?.limit ?? items.length);
    const totalPages = Number(data.meta?.totalPages ?? data.totalPages ?? Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 50, totalPages: 0 };
}

export async function getEnrollment(id: string) {
  const headers = await getAuthHeaders();
  const resp = await axios.get(`${BASE}/enrollments/${id}`, { headers });
  return resp.data as EnrollmentRecord;
}

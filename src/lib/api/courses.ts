import axios from "axios";
import { getCookie } from "../actions";

export type Course = {
  _id?: string;
  title: string;
  description: string;
  instructor?: string;
  duration?: string;
  price?: number;
  priceUSD?: number;
  modules?: number;
  image?: string;
  [k: string]: any;
};

const API_BASE = process.env.NEXT_PUBLIC_BASE_API_URL;

async function getAuthHeaders() {
  const authToken = await getCookie("smartiAdminToken");
  return { Authorization: `Bearer ${authToken?.value}` };
}

export async function createCourse(course: Course): Promise<Course> {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/courses`, course, {
    headers: { ...headers, "Content-Type": "application/json" },
  });

  return res.data;
}

export async function fetchCourses(page = 1, limit = 20) {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/courses`, {
    headers,
    params: { page, limit },
  });

  return res.data;
}

export async function updateCourse(id: string, data: Partial<Course>) {
  const headers = await getAuthHeaders();
  const res = await axios.put(`${API_BASE}/courses/${id}`, data, { headers: { ...headers, "Content-Type": "application/json" } });
  return res.data;
}

export async function deleteCourse(id: string) {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${API_BASE}/courses/${id}`, { headers });
  return res.data;
}

export async function uploadImage(file: File) {
  const headers = await getAuthHeaders();
  const fd = new FormData();
  fd.append("file", file);
  const res = await axios.post(`${API_BASE}/uploads/image`, fd, { headers: { ...headers, "Content-Type": "multipart/form-data" } });
  return res.data;
}

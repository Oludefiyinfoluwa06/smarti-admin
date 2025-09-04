"use server";

import { cookies } from "next/headers";

export const hasCookie = async (name: string) => {
  return (await cookies()).has(name);
};

export const getCookie = async (name: string) => {
  return (await cookies()).get(name);
};

export const setCookie = async (name: string, value: string) => {
  (await cookies()).set(name, value, { secure: true });
};

export const deleteCookie = async (name: string) => {
  (await cookies()).delete(name);
};

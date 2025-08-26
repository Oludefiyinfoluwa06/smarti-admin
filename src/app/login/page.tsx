"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const router = useRouter();

  function validate(): boolean {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: undefined }));
    try {
      router.push("/dashboard");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, form: error.response.data.message || "Login failed. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:block relative bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="absolute inset-0 p-10 flex flex-col">
          <div className="flex items-center gap-3 text-slate-800">
            <Image src="/assets/logo.png" alt="Smarti" width={50} height={50} />
          </div>
          <div className="mt-auto">
            <h2 className="text-slate-900 text-4xl font-semibold leading-tight max-w-md">
              Manage orders and craft newsletters with speed.
            </h2>
            <p className="text-slate-700 mt-3 max-w-lg">
              Powerful tools to streamline your operations. Sign in to access your dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/assets/logo.png" alt="Smarti" width={50} height={50} />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-slate-600 mt-1">Sign in to continue to your admin dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form ? (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {errors.form}
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="you@company.com"
              />
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="••••••••"
              />
              {errors.password ? (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-white font-medium shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}



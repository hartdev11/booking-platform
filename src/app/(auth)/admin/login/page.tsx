"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";

const schema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const userCredential = await signIn(data.email, data.password);
      const idToken = await userCredential.user.getIdToken();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("firebaseToken", idToken);
      }
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "สร้างเซสชันไม่สำเร็จ");
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
      const message =
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "เกิดข้อผิดพลาด";
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Admin
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              เข้าสู่ระบบเพื่อจัดการ
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3"
              >
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                className={cn(
                  "w-full rounded-lg border bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                  errors.email
                    ? "border-red-500/50"
                    : "border-zinc-700"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-lg border bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500",
                  errors.password
                    ? "border-red-500/50"
                    : "border-zinc-700"
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-emerald-600 py-3 px-4 font-medium text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
        <p className="text-center text-zinc-500 text-xs mt-6">
          ใช้บัญชีแอดมินที่ลงทะเบียนใน Firebase Authentication
        </p>
      </div>
    </div>
  );
}

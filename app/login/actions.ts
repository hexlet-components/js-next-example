"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "@/lib/auth";
export async function login(_previous: { error: string }, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Введите почту и пароль" };
  let token: string;
  try {
    const response = await fetch(`${process.env.EVENTS_API_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (response.status === 401) return { error: "Неверная почта или пароль" };
    if (!response.ok) return { error: "Не удалось войти" };
    ({ token } = await response.json());
  } catch {
    return { error: "API временно недоступен" };
  }
  (await cookies()).set("event-session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: 3600,
  });
  redirect("/events");
}
export async function logout() {
  const token = await getToken();
  if (token) {
    const response = await fetch(`${process.env.EVENTS_API_URL}/session`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok && response.status !== 401) throw new Error("Не удалось завершить сессию");
  }
  (await cookies()).delete("event-session");
  redirect("/login");
}

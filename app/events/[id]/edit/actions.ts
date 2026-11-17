"use server";
import { redirect, notFound } from "next/navigation";
import { requireUser, getToken } from "@/lib/auth";
import { getEvent } from "@/lib/events";
export async function updateEvent(id: string, _previous: { error: string }, formData: FormData) {
  const user = await requireUser();
  const event = await getEvent(id);
  if (!event) notFound();
  if (event.ownerId !== user.id) return { error: "Нет доступа к изменению" };
  const title = String(formData.get("title") || "").trim();
  if (!title || title.length > 100)
    return { error: "Название должно содержать от 1 до 100 символов" };
  const token = await getToken();
  try {
    const response = await fetch(`${process.env.EVENTS_API_URL}/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) return { error: "Не удалось изменить событие" };
  } catch {
    return { error: "API временно недоступен" };
  }
  redirect(`/events/${encodeURIComponent(id)}`);
}

"use server";
import { redirect } from "next/navigation";
export async function applyForEvent(
  eventId: string,
  _previous: { error: string },
  formData: FormData,
) {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Укажите имя и email" };
  try {
    const response = await fetch(
      `${process.env.EVENTS_API_URL}/events/${encodeURIComponent(eventId)}/applications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      },
    );
    if (!response.ok) return { error: "Не удалось отправить заявку" };
  } catch {
    return { error: "API временно недоступен" };
  }
  redirect(`/events/${encodeURIComponent(eventId)}?applied=1`);
}

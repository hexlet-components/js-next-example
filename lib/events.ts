import "server-only";
export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  ownerId: string;
  participants: number;
};
export type EventsPage = { items: Event[]; total: number; page: number; pageSize: number };
export async function getEvents(q = "", page = 1): Promise<EventsPage> {
  const url = new URL("/events", process.env.EVENTS_API_URL);
  url.search = new URLSearchParams({ q, page: String(page), pageSize: "2" }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить события");
  return response.json();
}
export async function getEvent(id: string): Promise<Event | null> {
  const response = await fetch(`${process.env.EVENTS_API_URL}/events/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Не удалось загрузить событие");
  return response.json();
}

import { Suspense } from "react";
import Link from "next/link";
import { getEvents } from "@/lib/events";
type Search = { q?: string | string[]; page?: string | string[] };
async function EventsResults({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const value = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(value) && value > 0 ? value : 1;
  const result = await getEvents(q, page);
  const pages = Math.ceil(result.total / result.pageSize);
  return (
    <>
      <form action="/events" method="get">
        <label>
          Поиск
          <input name="q" defaultValue={q} />
        </label>
        <button>Найти</button>
      </form>
      <p>Найдено событий {result.total}</p>
      {result.items.length === 0 ? (
        <p>Событий не найдено</p>
      ) : (
        result.items.map((event) => (
          <article key={event.id}>
            <h2>
              <Link href={`/events/${event.id}`}>{event.title}</Link>
            </h2>
            <p>{event.description}</p>
            <p>{event.date}</p>
          </article>
        ))
      )}
      <nav aria-label="Страницы">
        {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
          <Link
            key={number}
            aria-current={page === number ? "page" : undefined}
            href={`/events?${new URLSearchParams({ q, page: String(number) })}`}
          >
            {number}
          </Link>
        ))}
      </nav>
    </>
  );
}
export default function EventsPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <>
      <h1>События</h1>
      <Suspense fallback={<p>Загружаем события…</p>}>
        <EventsResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

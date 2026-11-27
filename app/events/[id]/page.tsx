import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/lib/events";
import FavoriteButton from "@/components/favorite-button";
import ApplicationForm from "@/components/application-form";
import { applyForEvent } from "@/app/events/[id]/actions";
export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string | string[] }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const { applied } = await searchParams;
  return (
    <>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <p>{event.date}</p>
      <p>Заявок {event.participants}</p>
      <FavoriteButton title={event.title} />
      <p>
        <Link href={`/events/${id}/edit`}>Редактировать</Link>
      </p>
      {applied === "1" && <output>Заявка принята</output>}
      <ApplicationForm action={applyForEvent.bind(null, id)} />
    </>
  );
}

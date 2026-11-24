import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import EditForm from "@/components/edit-form";
import { logout } from "@/app/login/actions";
import { updateEvent } from "@/app/events/[id]/edit/actions";
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  if (event.ownerId !== user.id) return <h1>Нет доступа к редактированию</h1>;
  return (
    <>
      <h1>Редактирование события</h1>
      <p>Вы вошли как {user.name}</p>
      <EditForm action={updateEvent.bind(null, id)} title={event.title} />
      <form action={logout}>
        <button>Выйти</button>
      </form>
    </>
  );
}

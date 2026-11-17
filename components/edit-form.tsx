"use client";
import { useActionState } from "react";
import { updateEvent } from "@/app/events/[id]/edit/actions";
export default function EditForm({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(updateEvent.bind(null, id), { error: "" });
  return (
    <form action={action}>
      <label>
        Название
        <input name="title" defaultValue={title} required maxLength={100} />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Сохранить</button>
    </form>
  );
}

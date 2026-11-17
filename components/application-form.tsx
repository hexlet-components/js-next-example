"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { applyForEvent } from "@/app/events/[id]/actions";
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Отправляем…" : "Отправить заявку"}</button>;
}
export default function ApplicationForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState(applyForEvent.bind(null, eventId), { error: "" });
  return (
    <form action={action}>
      <h2>Заявка на участие</h2>
      <label>
        Имя
        <input name="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

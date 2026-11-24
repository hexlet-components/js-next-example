"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Отправляем…" : "Отправить заявку"}</button>;
}
type FormState = { error: string };
export default function ApplicationForm({
  action,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, { error: "" });
  return (
    <form action={formAction}>
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

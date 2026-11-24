"use client";
import { useActionState } from "react";
type FormState = { error: string };
export default function EditForm({
  action,
  title,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  return (
    <form action={formAction}>
      <label>
        Название
        <input name="title" defaultValue={title} required maxLength={100} />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Сохранить</button>
    </form>
  );
}

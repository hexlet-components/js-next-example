"use client";
import { useActionState } from "react";
import { login } from "@/app/login/actions";
export default function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action}>
      <label>
        Почта
        <input name="email" type="email" required />
      </label>
      <label>
        Пароль
        <input name="password" type="password" required />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Войти</button>
    </form>
  );
}

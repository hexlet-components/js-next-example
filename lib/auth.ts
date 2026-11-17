import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export type User = { id: string; name: string; email: string };
export async function getToken() {
  return (await cookies()).get("event-session")?.value;
}
async function getUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;
  const response = await fetch(`${process.env.EVENTS_API_URL}/session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Не удалось проверить сессию");
  const data: { user: User } = await response.json();
  return data.user;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

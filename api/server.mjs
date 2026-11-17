import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

// Готовый локальный API для примеров. После перезапуска данные сбрасываются.
const events = [
  {
    id: "1",
    title: "Прогулка по набережной",
    description: "Встречаемся у городского моста.",
    date: "2026-12-12",
    ownerId: "1",
    participants: 0,
  },
  {
    id: "2",
    title: "Вечер настольных игр",
    description: "Играем в библиотеке.",
    date: "2026-12-14",
    ownerId: "2",
    participants: 0,
  },
  {
    id: "3",
    title: "Прогулка по старому городу",
    description: "Изучаем историю улиц.",
    date: "2026-12-15",
    ownerId: "1",
    participants: 0,
  },
  {
    id: "4",
    title: "Книжный клуб",
    description: "Обсуждаем прочитанное в кафе.",
    date: "2026-12-16",
    ownerId: "2",
    participants: 0,
  },
  {
    id: "5",
    title: "Прогулка по парку",
    description: "Наблюдаем за зимними птицами.",
    date: "2026-12-17",
    ownerId: "1",
    participants: 0,
  },
  {
    id: "6",
    title: "Мастерская рисунка",
    description: "Рисуем городской пейзаж.",
    date: "2026-12-18",
    ownerId: "2",
    participants: 0,
  },
];
const users = [
  { id: "1", name: "Анна", email: "anna@example.com", password: "password123" }, // betterleaks:allow учебные данные локального API
  { id: "2", name: "Борис", email: "boris@example.com", password: "password123" }, // betterleaks:allow учебные данные локального API
];
const sessions = new Map();
const applications = [];
const send = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(value === undefined ? undefined : JSON.stringify(value));
};
const tokenFrom = (req) => req.headers.authorization?.replace(/^Bearer /, "");
const userFrom = (req) => {
  const session = sessions.get(tokenFrom(req));
  return session && session.expires > Date.now()
    ? users.find((u) => u.id === session.userId)
    : undefined;
};
const bodyFrom = async (req) => {
  let text = "";
  for await (const part of req) {
    text += part;
    if (text.length > 10000) throw new Error("body too large");
  }
  return JSON.parse(text || "{}");
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    if (path === "/health") return send(res, 200, { status: "ok" });
    if (req.method === "GET" && path.startsWith("/events")) {
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.API_DELAY_MS || 0)));
      if (process.env.API_FAIL === "1")
        return send(res, 503, { message: "API временно недоступен" });
    }
    if (req.method === "GET" && path === "/events") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const page = Math.max(1, Math.floor(Number(url.searchParams.get("page"))) || 1);
      const pageSize = Math.min(
        20,
        Math.max(1, Math.floor(Number(url.searchParams.get("pageSize"))) || 2),
      );
      const filtered = events.filter((event) => event.title.toLowerCase().includes(q));
      return send(res, 200, {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
      });
    }
    const match = path.match(/^\/events\/([^/]+)(\/applications)?$/);
    if (match) {
      const event = events.find((item) => item.id === match[1]);
      if (!event) return send(res, 404, { message: "Событие не найдено" });
      if (req.method === "GET" && !match[2]) return send(res, 200, event);
      if (req.method === "POST" && match[2]) {
        const data = await bodyFrom(req);
        if (
          typeof data.name !== "string" ||
          !data.name.trim() ||
          typeof data.email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
        )
          return send(res, 422, { message: "Укажите имя и email" });
        const application = {
          id: randomUUID(),
          eventId: event.id,
          name: data.name.trim(),
          email: data.email.trim(),
        };
        applications.push(application);
        event.participants += 1;
        return send(res, 201, application);
      }
      if (req.method === "PATCH" && !match[2]) {
        const user = userFrom(req);
        if (!user) return send(res, 401, { message: "Войдите в приложение" });
        if (event.ownerId !== user.id) return send(res, 403, { message: "Нет доступа" });
        const data = await bodyFrom(req);
        if (typeof data.title !== "string" || !data.title.trim() || data.title.trim().length > 100)
          return send(res, 422, { message: "Название должно содержать от 1 до 100 символов" });
        event.title = data.title.trim();
        return send(res, 200, event);
      }
    }
    if (path === "/sessions" && req.method === "POST") {
      const data = await bodyFrom(req);
      const user = users.find(
        (item) => item.email === data.email && item.password === data.password,
      );
      if (!user) return send(res, 401, { message: "Неверная почта или пароль" });
      const token = randomUUID();
      sessions.set(token, { userId: user.id, expires: Date.now() + 3600000 });
      return send(res, 200, { token });
    }
    if (path === "/session") {
      const user = userFrom(req);
      if (!user) return send(res, 401, { message: "Войдите в приложение" });
      if (req.method === "DELETE") {
        sessions.delete(tokenFrom(req));
        return send(res, 204);
      }
      if (req.method === "GET")
        return send(res, 200, { user: { id: user.id, name: user.name, email: user.email } });
    }
    return send(res, 404, { message: "Адрес не найден" });
  } catch {
    return send(res, 400, { message: "Некорректный запрос" });
  }
}).listen(Number(process.env.API_PORT || 4000), "127.0.0.1", () =>
  console.log(`Events API http://localhost:${process.env.API_PORT || 4000}`),
);

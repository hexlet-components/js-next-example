import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Почта", { exact: true }).fill("anna@example.com");
  await page.getByLabel("Пароль", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

test("карточки открываются напрямую, меню и история сохраняют адреса", async ({ page }) => {
  await page.goto("/events/1");
  await expect(
    page.getByRole("heading", { name: "Прогулка по набережной", exact: true }),
  ).toBeVisible();
  await page.goto("/events/2");
  await expect(
    page.getByRole("heading", { name: "Вечер настольных игр", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "О каталоге", exact: true }).click();
  await expect(page.getByRole("heading", { name: "О каталоге", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/events\/2$/);
});

test("поиск убирает пробелы, пагинация сохраняет запрос после обновления", async ({ page }) => {
  await page.goto("/events");
  await page.getByLabel("Поиск", { exact: true }).fill(" Прогулка ");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await expect(page.getByText("Найдено событий 3", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Прогулка по парку", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Прогулка по парку", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("q")).toBe("Прогулка");
});

test("кнопка избранного меняется по клику и сбрасывается при обновлении", async ({ page }) => {
  await page.goto("/events/1");
  await page
    .getByRole("button", { name: "В избранное «Прогулка по набережной»", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Убрать «Прогулка по набережной» из избранного",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "В избранное «Прогулка по набережной»", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("форма проверяет поля на сервере и показывает новый счётчик после заявки", async ({
  page,
}) => {
  await page.goto("/events/1");
  await page.getByLabel("Имя", { exact: true }).fill("   ");
  await page.getByLabel("Email", { exact: true }).fill("irina@example.com");
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Укажите имя и email" })).toBeVisible();
  await page.getByLabel("Имя", { exact: true }).fill("Ирина");
  await page.getByLabel("Email", { exact: true }).fill("irina@example.com");
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Заявка принята" })).toBeVisible();
  await expect(page.getByText("Заявок 1", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Заявок 1", { exact: true })).toBeVisible();
});

test("отсутствующее событие показывает отдельную страницу", async ({ page }) => {
  await page.goto("/events/missing");
  await expect(
    page.getByRole("heading", { name: "Событие не найдено", exact: true }),
  ).toBeVisible();
});

test("владелец меняет своё событие, чужое закрыто, выход отзывает сессию", async ({
  page,
  context,
  api,
}) => {
  await page.goto("/events/1/edit");
  await expect(page.getByRole("heading", { name: "Вход организатора", exact: true })).toBeVisible();
  await login(page);
  const cookie = (await context.cookies()).find((item) => item.name === "event-session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.goto("/events/1/edit");
  await page.getByLabel("Название", { exact: true }).fill("Прогулка с гидом");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Прогулка с гидом", exact: true })).toBeVisible();
  await page.goto("/events/2/edit");
  await expect(
    page.getByRole("heading", { name: "Нет доступа к редактированию", exact: true }),
  ).toBeVisible();
  await page.goto("/events/1/edit");
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const response = await fetch(`${api.url}/session`, {
    headers: { Authorization: `Bearer ${cookie?.value}` },
  });
  expect(response.status).toBe(401);
});

test("старая форма после выхода в другой вкладке не сохраняет изменение", async ({
  page,
  context,
  api,
}) => {
  await login(page);
  await page.goto("/events/1/edit");
  await page.getByLabel("Название", { exact: true }).fill("Из старой вкладки");
  const other = await context.newPage();
  await other.goto("/events/1/edit");
  await other.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(other).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const event = await (await fetch(`${api.url}/events/1`)).json();
  expect(event.title).toBe("Прогулка по набережной");
});

test("ожидание, отказ API и retry возвращают пользователя к карточке", async ({ page, api }) => {
  await api.restart({ API_DELAY_MS: "1500" });
  await page.goto("/events/1", { waitUntil: "commit" });
  await expect(page.getByText("Загружаем события…", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Прогулка по набережной", exact: true }),
  ).toBeVisible();
  await api.restart({ API_FAIL: "1" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "События временно недоступны", exact: true }),
  ).toBeVisible();
  await api.restart();
  await page.getByRole("button", { name: "Попробовать снова", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Прогулка по набережной", exact: true }),
  ).toBeVisible();
});

test("сетевая ошибка заявки остаётся сообщением формы", async ({ page, api }) => {
  await page.goto("/events/1");
  await page.getByRole("heading", { name: "Прогулка по набережной", exact: true }).waitFor();
  await api.stop();
  await page.getByLabel("Имя", { exact: true }).fill("Ирина");
  await page.getByLabel("Email", { exact: true }).fill("irina@example.com");
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "API временно недоступен" }),
  ).toBeVisible();
});

test("справка видна без JavaScript, ответ карточки содержит серверные данные", async ({
  browser,
  request,
}) => {
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const page = await plain.newPage();
  await page.goto("http://127.0.0.1:4311/about");
  await expect(page.getByRole("heading", { name: "О каталоге", exact: true })).toBeVisible();
  const response = await request.get("/events/1");
  expect(await response.text()).toContain("Прогулка по набережной");
  await plain.close();
});

test("заявка до загрузки скриптов показывает ошибку сервера и принимается после исправления", async ({
  page,
}) => {
  // Без чанков приложения форма не гидратируется и уходит обычным POST-запросом браузера.
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
  await page.goto("/events/1");
  await page.getByLabel("Имя", { exact: true }).fill("   ");
  await page.getByLabel("Email", { exact: true }).fill("irina@example.com");
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Укажите имя и email" })).toBeVisible();
  await page.getByLabel("Имя", { exact: true }).fill("Ирина");
  await page.getByLabel("Email", { exact: true }).fill("irina@example.com");
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Заявка принята" })).toBeVisible();
});

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { startApi } from "../support/api-process.mjs";

let api;
beforeEach(async () => {
  api = await startApi(4312);
});
afterEach(async () => {
  await api?.stop();
});
const request = async (path, options) => fetch(`${api.url}${path}`, options);
const json = (method, body, token) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
});

test("поиск и пагинация возвращают данные из контракта курса", async () => {
  const response = await request("/events?q=" + encodeURIComponent("Прогулка") + "&page=2");
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.total, 3);
  assert.deepEqual(
    data.items.map((event) => event.id),
    ["5"],
  );
});

test("неизвестный id возвращает 404", async () => {
  assert.equal((await request("/events/missing")).status, 404);
});

test("невалидная заявка не меняет счётчик, валидная заявка сохраняется", async () => {
  const invalid = await request(
    "/events/1/applications",
    json("POST", { name: " ", email: "irina@example.com" }),
  );
  assert.equal(invalid.status, 422);
  assert.equal((await (await request("/events/1")).json()).participants, 0);
  const valid = await request(
    "/events/1/applications",
    json("POST", { name: "Ирина", email: "irina@example.com" }),
  );
  assert.equal(valid.status, 201);
  assert.equal((await (await request("/events/1")).json()).participants, 1);
});

test("API проверяет сессию и владельца при прямом изменении", async () => {
  assert.equal((await request("/events/1", json("PATCH", { title: "Изменено" }))).status, 401);
  const login = await request(
    "/sessions",
    json("POST", { email: "anna@example.com", password: "password123" }), // betterleaks:allow учебные данные локального API
  );
  const { token } = await login.json();
  assert.equal((await request("/events/2", json("PATCH", { title: "Чужое" }, token))).status, 403);
  assert.equal(
    (await request("/events/1", json("PATCH", { title: "Прогулка с гидом" }, token))).status,
    200,
  );
  const logout = await request("/session", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(logout.status, 204);
  assert.equal(
    (await request("/session", { headers: { Authorization: `Bearer ${token}` } })).status,
    401,
  );
});

test("неверный пароль и повреждённый JSON отклоняются", async () => {
  assert.equal(
    (await request("/sessions", json("POST", { email: "anna@example.com", password: "wrong" }))) // betterleaks:allow учебные данные локального API
      .status,
    401,
  );
  assert.equal((await request("/sessions", { method: "POST", body: "{" })).status, 400);
});

test("режим отказа не ломает проверку готовности API", async () => {
  await api.restart({ API_FAIL: "1" });
  assert.equal((await request("/health")).status, 200);
  assert.equal((await request("/events")).status, 503);
});

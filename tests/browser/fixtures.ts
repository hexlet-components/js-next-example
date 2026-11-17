import { test as base, expect } from "@playwright/test";
import { startApi } from "../support/api-process.mjs";

type Api = Awaited<ReturnType<typeof startApi>>;

export const test = base.extend<{ api: Api }>({
  api: [
    async ({ request }, use) => {
      const api = await startApi(4310);
      try {
        const health = await request.get(`${api.url}/health`);
        expect(health.ok()).toBe(true);
        await use(api);
      } finally {
        await api.stop();
      }
    },
    { auto: true },
  ],
});

export { expect };

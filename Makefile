.PHONY: install setup dev api build start lint typecheck test test-api test-browser check

install:
	pnpm install --frozen-lockfile

setup: install
	test -f .env.local || cp .env.example .env.local

dev:
	pnpm dev

api:
	node api/server.mjs

build:
	pnpm build

start:
	node node_modules/next/dist/bin/next start

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test-api:
	pnpm test:api

test-browser:
	pnpm test:browser

test:
	pnpm test

check:
	pnpm check

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "Городские события",
  description: "Каталог мероприятий города",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header>
          <nav aria-label="Главное меню">
            <Link href="/">Главная</Link>
            <Link href="/events">События</Link>
            <Link href="/about">О каталоге</Link>
            <Link href="/login">Вход</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

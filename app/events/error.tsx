"use client";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <>
      <h1>События временно недоступны</h1>
      <p>Повторите попытку позже.</p>
      <button onClick={() => retry()}>Попробовать снова</button>
    </>
  );
}

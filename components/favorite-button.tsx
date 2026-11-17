"use client";
import { useState } from "react";
export default function FavoriteButton({ title }: { title: string }) {
  const [selected, setSelected] = useState(false);
  return (
    <button type="button" aria-pressed={selected} onClick={() => setSelected(!selected)}>
      {selected ? `Убрать «${title}» из избранного` : `В избранное «${title}»`}
    </button>
  );
}

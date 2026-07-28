"use client";

import Image from "next/image";
import { useState } from "react";

/** Galerie de fiche produit : grande photo + miniatures cliquables. */
export function GaleriePhotos({
  images,
  titre,
}: {
  images: { id: string; url: string }[];
  titre: string;
}) {
  const [index, setIndex] = useState(0);
  const image = images[Math.min(index, Math.max(images.length - 1, 0))];

  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-contour-carte bg-white">
        {image ? (
          <Image
            key={image.id}
            src={image.url}
            alt={titre}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
            <svg width="40%" height="40%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v8.6l3.5-3.5 2.5 2.5L15 10l4 4V7H5zm3 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            </svg>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border bg-white transition ${
                i === index
                  ? "border-nile ring-2 ring-nile/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { describe, expect, it } from "vitest";
import {
  DUREE_VIDEO_MAX_SECONDES,
  MAX_MEDIAS_PAR_PUBLICATION,
  MAX_TAGS_PRODUITS,
  TEXTE_PUBLICATION_MAX,
  dedupliquer,
  messageErreurPublication,
  validerMedia,
  validerPublication,
} from "./reels-core";

describe("validerMedia", () => {
  it("accepte les trois formats d'image dans la limite", () => {
    for (const typeMime of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validerMedia({ typeMime, tailleOctets: 1024 })).toEqual({
        ok: true,
        type: "IMAGE",
      });
    }
  });

  it("refuse une image au-dessus de 2 Mo", () => {
    expect(
      validerMedia({
        typeMime: "image/jpeg",
        tailleOctets: 3 * 1024 * 1024,
      }),
    ).toEqual({ ok: false, code: "TROP_LOURDE" });
  });

  it("accepte une vidéo MP4 dans les limites poids et durée", () => {
    expect(
      validerMedia({
        typeMime: "video/mp4",
        tailleOctets: 10 * 1024 * 1024,
        dureeSecondes: 30,
      }),
    ).toEqual({ ok: true, type: "VIDEO" });
  });

  it("refuse une vidéo au-dessus de 15 Mo", () => {
    expect(
      validerMedia({
        typeMime: "video/mp4",
        tailleOctets: 16 * 1024 * 1024,
        dureeSecondes: 10,
      }),
    ).toEqual({ ok: false, code: "TROP_LOURDE" });
  });

  it("refuse une vidéo plus longue que la limite", () => {
    expect(
      validerMedia({
        typeMime: "video/mp4",
        tailleOctets: 1024,
        dureeSecondes: DUREE_VIDEO_MAX_SECONDES + 1,
      }),
    ).toEqual({ ok: false, code: "DUREE_TROP_LONGUE" });
  });

  it("accepte une vidéo exactement à la durée limite", () => {
    expect(
      validerMedia({
        typeMime: "video/mp4",
        tailleOctets: 1024,
        dureeSecondes: DUREE_VIDEO_MAX_SECONDES,
      }),
    ).toEqual({ ok: true, type: "VIDEO" });
  });

  it("refuse un type non reconnu (GIF, WebM, exécutable…)", () => {
    expect(validerMedia({ typeMime: "image/gif", tailleOctets: 100 })).toEqual({
      ok: false,
      code: "TYPE_INVALIDE",
    });
    expect(validerMedia({ typeMime: "video/webm", tailleOctets: 100 })).toEqual(
      { ok: false, code: "TYPE_INVALIDE" },
    );
  });

  it("ignore la durée pour une image", () => {
    expect(
      validerMedia({
        typeMime: "image/png",
        tailleOctets: 1024,
        dureeSecondes: 999,
      }),
    ).toEqual({ ok: true, type: "IMAGE" });
  });
});

describe("validerPublication", () => {
  const mediaOk = { typeMime: "image/jpeg", tailleOctets: 1024 };

  it("accepte une publication minimale : une image, pas de texte", () => {
    expect(
      validerPublication({ texte: "", medias: [mediaOk], produitIds: [] }),
    ).toEqual({ ok: true });
  });

  it("accepte une vidéo unique mêlée à des images", () => {
    expect(
      validerPublication({
        texte: "Nouveaux arrivages",
        medias: [
          mediaOk,
          { typeMime: "video/mp4", tailleOctets: 5 * 1024 * 1024 },
        ],
        produitIds: [],
      }),
    ).toEqual({ ok: true });
  });

  it("refuse une publication sans aucun média", () => {
    expect(
      validerPublication({ texte: "texte seul", medias: [], produitIds: [] }),
    ).toEqual({ ok: false, code: "AUCUN_MEDIA" });
  });

  it("refuse plus de cinq médias", () => {
    expect(
      validerPublication({
        texte: "",
        medias: Array.from({ length: MAX_MEDIAS_PAR_PUBLICATION + 1 }, () => mediaOk),
        produitIds: [],
      }),
    ).toEqual({ ok: false, code: "TROP_DE_MEDIAS" });
  });

  it("refuse deux vidéos même dans le plafond de médias", () => {
    expect(
      validerPublication({
        texte: "",
        medias: [
          { typeMime: "video/mp4", tailleOctets: 1024 },
          { typeMime: "video/mp4", tailleOctets: 1024 },
        ],
        produitIds: [],
      }),
    ).toEqual({ ok: false, code: "TROP_DE_VIDEOS" });
  });

  it("refuse une légende plus longue que la limite", () => {
    expect(
      validerPublication({
        texte: "a".repeat(TEXTE_PUBLICATION_MAX + 1),
        medias: [mediaOk],
        produitIds: [],
      }),
    ).toEqual({ ok: false, code: "TEXTE_TROP_LONG" });
  });

  it("accepte une légende exactement à la limite", () => {
    expect(
      validerPublication({
        texte: "a".repeat(TEXTE_PUBLICATION_MAX),
        medias: [mediaOk],
        produitIds: [],
      }),
    ).toEqual({ ok: true });
  });

  it("refuse plus de quatre tags produits", () => {
    expect(
      validerPublication({
        texte: "",
        medias: [mediaOk],
        produitIds: ["a", "b", "c", "d", "e"],
      }),
    ).toEqual({ ok: false, code: "TROP_DE_TAGS" });
  });

  it("accepte exactement quatre tags", () => {
    expect(
      validerPublication({
        texte: "",
        medias: [mediaOk],
        produitIds: ["a", "b", "c", "d"],
      }),
    ).toEqual({ ok: true });
  });
});

describe("dedupliquer", () => {
  it("retire les doublons en gardant l'ordre", () => {
    expect(dedupliquer(["b", "a", "b", "c", "a"])).toEqual(["b", "a", "c"]);
  });

  it("renvoie une liste vide pour une entrée vide", () => {
    expect(dedupliquer([])).toEqual([]);
  });
});

describe("messageErreurPublication", () => {
  it("couvre chaque code de validation", () => {
    for (const code of [
      "TYPE_INVALIDE",
      "TROP_LOURDE",
      "DUREE_TROP_LONGUE",
      "TEXTE_TROP_LONG",
      "AUCUN_MEDIA",
      "TROP_DE_MEDIAS",
      "TROP_DE_VIDEOS",
      "TROP_DE_TAGS",
    ]) {
      expect(messageErreurPublication(code)).not.toBe("Publication invalide.");
    }
  });

  it("tombe sur le message par défaut pour un code inconnu", () => {
    expect(messageErreurPublication("INCONNU")).toBe("Publication invalide.");
  });
});

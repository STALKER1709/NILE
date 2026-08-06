import { describe, it, expect, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { restituerStockTx } from "@/modules/commande/stock";

/**
 * Transaction factice : on n'observe que ce qui est écrit, et sur QUELLE
 * table. C'est précisément là que la règle avait divergé — le stock était
 * décrémenté sur la déclinaison et recrédité sur le produit, ce qui amputait
 * définitivement le vendeur à chaque paiement échoué.
 */
function txFactice() {
  const variante = { update: vi.fn().mockResolvedValue({}) };
  const produit = { update: vi.fn().mockResolvedValue({}) };
  return {
    tx: { varianteProduit: variante, produit } as unknown as Prisma.TransactionClient,
    variante,
    produit,
  };
}

describe("restituerStockTx", () => {
  it("recrédite la DÉCLINAISON, jamais le produit", () => {
    const { tx, variante, produit } = txFactice();
    return restituerStockTx(tx, [{ varianteId: "v1", quantite: 3 }]).then(() => {
      expect(produit.update).not.toHaveBeenCalled();
      expect(variante.update).toHaveBeenCalledWith({
        where: { id: "v1" },
        data: { stock: { increment: 3 } },
      });
    });
  });

  it("restitue chaque ligne de la commande", async () => {
    const { tx, variante } = txFactice();
    await restituerStockTx(tx, [
      { varianteId: "v1", quantite: 1 },
      { varianteId: "v2", quantite: 2 },
    ]);
    expect(variante.update).toHaveBeenCalledTimes(2);
  });

  it("ignore les lignes antérieures aux déclinaisons", async () => {
    // Elles n'en désignent aucune : deviner laquelle recréditer serait pire
    // que de ne rien faire.
    const { tx, variante } = txFactice();
    await restituerStockTx(tx, [{ varianteId: null, quantite: 5 }]);
    expect(variante.update).not.toHaveBeenCalled();
  });

  it("ne fait rien sur une commande sans ligne", async () => {
    const { tx, variante } = txFactice();
    await restituerStockTx(tx, []);
    expect(variante.update).not.toHaveBeenCalled();
  });
});

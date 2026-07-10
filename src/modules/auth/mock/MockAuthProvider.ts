import { cookies } from "next/headers";
import { randomUUID, timingSafeEqual, createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import type { AuthProvider, AuthResult } from "@/modules/auth/AuthProvider";
import { hasherMotDePasse, verifierMotDePasse } from "@/modules/auth/mock/hash";

/**
 * Fournisseur d'authentification MOCK — DÉVELOPPEMENT / TESTS UNIQUEMENT.
 *
 * Il n'est PAS conçu pour la production : les identifiants sont stockés dans la
 * table `MockCredential` (hash scrypt) et la session est un simple cookie signé.
 * En production, on utilise SupabaseAuthProvider. La sélection se fait dans
 * `src/modules/auth/index.ts`, qui interdit ce mock hors développement.
 */

const COOKIE_SESSION = "nile_session";

function signer(authId: string): string {
  const secret = env.MOCK_AUTH_SECRET ?? "";
  const signature = createHmac("sha256", secret).update(authId).digest("hex");
  return `${authId}.${signature}`;
}

function verifierCookie(valeur: string): string | null {
  const point = valeur.lastIndexOf(".");
  if (point <= 0) return null;
  const authId = valeur.slice(0, point);
  const signatureRecue = valeur.slice(point + 1);
  const signatureAttendue = createHmac("sha256", env.MOCK_AUTH_SECRET ?? "")
    .update(authId)
    .digest("hex");
  const a = Buffer.from(signatureRecue);
  const b = Buffer.from(signatureAttendue);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return authId;
}

export class MockAuthProvider implements AuthProvider {
  async signUp(
    email: string,
    password: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const emailNorm = email.trim().toLowerCase();
    const existant = await prisma.mockCredential.findUnique({
      where: { email: emailNorm },
    });
    if (existant) {
      return { ok: false, error: "EMAIL_DEJA_UTILISE" };
    }
    const authId = randomUUID();
    await prisma.mockCredential.create({
      data: { authId, email: emailNorm, motDePasse: hasherMotDePasse(password) },
    });
    return { ok: true, data: { authId } };
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const emailNorm = email.trim().toLowerCase();
    const cred = await prisma.mockCredential.findUnique({
      where: { email: emailNorm },
    });
    if (!cred || !verifierMotDePasse(password, cred.motDePasse)) {
      return { ok: false, error: "IDENTIFIANTS_INVALIDES" };
    }
    const store = await cookies();
    store.set(COOKIE_SESSION, signer(cred.authId), {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });
    return { ok: true, data: { authId: cred.authId } };
  }

  async signOut(): Promise<void> {
    const store = await cookies();
    store.delete(COOKIE_SESSION);
  }

  async getCurrentAuthId(): Promise<string | null> {
    const store = await cookies();
    const cookie = store.get(COOKIE_SESSION);
    if (!cookie) return null;
    return verifierCookie(cookie.value);
  }

  async deleteIdentity(authId: string): Promise<void> {
    await prisma.mockCredential
      .delete({ where: { authId } })
      .catch(() => undefined); // best-effort
  }

  async demanderReinitialisation(
    email: string,
    urlRedirection: string,
  ): Promise<void> {
    // Le mock n'envoie pas d'email : on journalise pour le développement.
    console.log(
      `[mock-auth] réinitialisation demandée pour ${email} (lien réel : ${urlRedirection})`,
    );
  }

  async changerMotDePasse(
    nouveauMotDePasse: string,
  ): Promise<AuthResult<{ authId: string }>> {
    const authId = await this.getCurrentAuthId();
    if (!authId) return { ok: false, error: "IDENTIFIANTS_INVALIDES" };
    await prisma.mockCredential.update({
      where: { authId },
      data: { motDePasse: hasherMotDePasse(nouveauMotDePasse) },
    });
    return { ok: true, data: { authId } };
  }
}

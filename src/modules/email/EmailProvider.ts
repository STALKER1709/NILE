/**
 * Interface abstraite d'envoi d'email transactionnel.
 * Même philosophie que le paiement et le stockage : le reste de l'application
 * ne connaît QUE cette interface.
 *   - MockEmailProvider  : développement/tests (journalise, n'envoie rien).
 *   - BrevoEmailProvider : fournisseur managé réel (production).
 * L'envoi d'email ne doit JAMAIS faire échouer l'opération métier qui le
 * déclenche : les appelants attrapent et journalisent les erreurs.
 */

export interface MessageEmail {
  /** Adresse du destinataire. */
  a: string;
  /** Nom du destinataire (affichage). */
  nomDestinataire?: string;
  sujet: string;
  /** Version texte brut (toujours fournie : clients mail légers, spam-score). */
  texte: string;
  /** Version HTML légère (optionnelle). */
  html?: string;
}

export interface EmailProvider {
  envoyer(message: MessageEmail): Promise<void>;
}

/** Fournisseur d'envoi de messages WhatsApp (Cloud API, Meta, ou mock dev). */
export interface WhatsAppProvider {
  /** Message texte libre : uniquement valable dans la fenêtre de service (24h). */
  envoyerTexte(telephone: string, texte: string): Promise<void>;
  /** Message template approuvé : seul type autorisé hors fenêtre de service. */
  envoyerTemplate(
    telephone: string,
    nomTemplate: string,
    parametresCorps: string[],
  ): Promise<void>;
}

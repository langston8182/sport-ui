/**
 * Normalise une chaîne en supprimant les accents et en la convertissant en minuscules
 * Exemples:
 * - "Développé" -> "developpe"
 * - "Épaule" -> "epaule"
 * - "Crêpe" -> "crepe"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Supprime les marques diacritiques (accents)
    .trim();
}

/**
 * Vérifie si un terme de recherche correspond à un texte en ignorant les accents
 * @param searchTerm - Le terme recherché
 * @param text - Le texte dans lequel chercher
 * @returns true si le terme est trouvé (sans tenir compte des accents)
 */
export function matchesSearchTerm(searchTerm: string, text: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const normalizedSearch = normalizeString(searchTerm);
  const normalizedText = normalizeString(text);
  
  return normalizedText.includes(normalizedSearch);
}
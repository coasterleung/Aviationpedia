/**
 * Curated overrides for alliance member -> Wikidata QID mapping.
 * Needed where Wikipedia member names differ from Wikidata labels,
 * or the airline lacks an English label / is not in the Q46970 class set.
 * Source: verified via Wikidata search API (2025-08).
 */
export const ALLIANCE_MEMBER_OVERRIDES: Record<string, string> = {
  // Star Alliance
  'Thai Airways International': 'Q188710', // Wikidata label: "Thai Airways"
  // SkyTeam
  'Aerolíneas Argentinas': 'Q83535',
  'Aerolineas Argentinas': 'Q83535',
  'Korean Air': 'Q213147', // lacks en label -> fell through A2
  'Middle East Airlines': 'Q859510', // label: "Middle East Airlines - Air Liban"
  'TAROM': 'Q240656',
  'XiamenAir': 'Q147208', // label: "Xiamen Airlines"
  // Oneworld
  'Qantas': 'Q32491', // label: "Qantas Airways"
  'Iberia Express': 'Q152274', // affiliate listed in table; full member is Iberia
  'Iberia': 'Q152274',
};

/**
 * Country flags via flagcdn.com.
 *
 * Emoji flags don't render on Windows, so teams use real flag images instead.
 * Maps each FIFA three-letter code to the flagcdn code (mostly ISO 3166-1
 * alpha-2; the UK home nations use flagcdn's `gb-eng` / `gb-wls` variants).
 */
export const FIFA_TO_ISO2: Record<string, string> = {
  MEX: 'mx',
  POL: 'pl',
  KSA: 'sa',
  NZL: 'nz',
  CAN: 'ca',
  BEL: 'be',
  KOR: 'kr',
  EGY: 'eg',
  USA: 'us',
  WAL: 'gb-wls',
  IRN: 'ir',
  GHA: 'gh',
  ARG: 'ar',
  AUS: 'au',
  CIV: 'ci',
  UZB: 'uz',
  FRA: 'fr',
  SEN: 'sn',
  JPN: 'jp',
  CRC: 'cr',
  BRA: 'br',
  SUI: 'ch',
  CMR: 'cm',
  QAT: 'qa',
  ENG: 'gb-eng',
  ECU: 'ec',
  SRB: 'rs',
  PAN: 'pa',
  ESP: 'es',
  CRO: 'hr',
  MAR: 'ma',
  JOR: 'jo',
  POR: 'pt',
  URU: 'uy',
  NGA: 'ng',
  NOR: 'no',
  GER: 'de',
  COL: 'co',
  TUN: 'tn',
  HON: 'hn',
  NED: 'nl',
  DEN: 'dk',
  ALG: 'dz',
  JAM: 'jm',
  ITA: 'it',
  UKR: 'ua',
  MLI: 'ml',
  CUW: 'cw',
};

/** flagcdn SVG url for a FIFA code, or '' when the code is unknown. */
export function flagUrl(code: string | null | undefined): string {
  if (!code) return '';
  const iso = FIFA_TO_ISO2[code.toUpperCase()];
  return iso ? `https://flagcdn.com/${iso}.svg` : '';
}

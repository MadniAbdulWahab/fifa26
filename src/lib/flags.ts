/**
 * Country flags via flagcdn.com.
 *
 * Emoji flags don't render on Windows, so teams use real flag images instead.
 * Maps each FIFA three-letter code to the flagcdn code (mostly ISO 3166-1
 * alpha-2; the UK home nations use flagcdn's `gb-eng` / `gb-wls` variants).
 */
export const FIFA_TO_ISO2: Record<string, string> = {
  MEX: 'mx',
  RSA: 'za',
  CZE: 'cz',
  CAN: 'ca',
  BIH: 'ba',
  KOR: 'kr',
  QAT: 'qa',
  SUI: 'ch',
  BRA: 'br',
  MAR: 'ma',
  SCO: 'gb-sct',
  HAI: 'ht',
  USA: 'us',
  PAR: 'py',
  AUS: 'au',
  TUR: 'tr',
  GER: 'de',
  ECU: 'ec',
  CIV: 'ci',
  CUW: 'cw',
  NED: 'nl',
  JPN: 'jp',
  SWE: 'se',
  TUN: 'tn',
  BEL: 'be',
  EGY: 'eg',
  IRN: 'ir',
  NZL: 'nz',
  ESP: 'es',
  CPV: 'cv',
  KSA: 'sa',
  URU: 'uy',
  FRA: 'fr',
  SEN: 'sn',
  IRQ: 'iq',
  NOR: 'no',
  ARG: 'ar',
  ALG: 'dz',
  AUT: 'at',
  JOR: 'jo',
  POR: 'pt',
  COD: 'cd',
  UZB: 'uz',
  COL: 'co',
  ENG: 'gb-eng',
  CRO: 'hr',
  GHA: 'gh',
  PAN: 'pa',
};

/** flagcdn SVG url for a FIFA code, or '' when the code is unknown. */
export function flagUrl(code: string | null | undefined): string {
  if (!code) return '';
  const iso = FIFA_TO_ISO2[code.toUpperCase()];
  return iso ? `https://flagcdn.com/${iso}.svg` : '';
}

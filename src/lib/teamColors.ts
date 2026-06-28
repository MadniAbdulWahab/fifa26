import type { Team } from '@/domain/types';

const DEFAULT_ACCENT = '#38bdf8';

const TEAM_ACCENT_BY_CODE: Record<string, string> = {
  ALG: '#006233',
  ARG: '#74acdf',
  AUS: '#00008b',
  AUT: '#ed2939',
  BEL: '#fae042',
  BIH: '#002f6c',
  BRA: '#009b3a',
  CAN: '#d80621',
  CIV: '#f77f00',
  COD: '#007fff',
  COL: '#fcd116',
  CPV: '#003893',
  CRO: '#f00000',
  CUW: '#002b7f',
  CZE: '#d7141a',
  ECU: '#fcd116',
  EGY: '#ce1126',
  ENG: '#cf142b',
  ESP: '#aa151b',
  FRA: '#0055a4',
  GER: '#dd0000',
  GHA: '#006b3f',
  HAI: '#00209f',
  IRN: '#239f40',
  IRQ: '#ce1126',
  JOR: '#007a3d',
  JPN: '#bc002d',
  KOR: '#c60c30',
  KSA: '#006c35',
  MAR: '#c1272d',
  MEX: '#006847',
  NED: '#ae1c28',
  NOR: '#ba0c2f',
  NZL: '#00247d',
  PAN: '#d21034',
  PAR: '#0038a8',
  POR: '#006600',
  QAT: '#8a1538',
  RSA: '#007a4d',
  SCO: '#005eb8',
  SEN: '#00853f',
  SUI: '#d52b1e',
  SWE: '#006aa7',
  TUN: '#e70013',
  TUR: '#e30a17',
  URU: '#0038a8',
  USA: '#b22234',
  UZB: '#0099b5',
};

export function teamAccentColor(team: Team | undefined): string {
  if (!team) return DEFAULT_ACCENT;
  return TEAM_ACCENT_BY_CODE[team.code.toUpperCase()] ?? DEFAULT_ACCENT;
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return hex;
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

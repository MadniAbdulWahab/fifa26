import type { GroupId, Team } from '@/domain/types';

/**
 * World Cup 2026 group draw used by the bundled static data.
 *
 * This file is intentionally schedule-focused: it keeps the app useful without
 * a live API token, but it does not claim to provide live scores or scorer
 * events. Ratings are approximate strengths used only by the odds simulation.
 */
export interface SeedTeam extends Team {
  group: GroupId;
}

export const SEED_TEAMS: SeedTeam[] = [
  // Group A
  {
    id: 'mex',
    name: 'Mexico',
    code: 'MEX',
    flag: '',
    rating: 1840,
    group: 'A',
  },
  {
    id: 'rsa',
    name: 'South Africa',
    code: 'RSA',
    flag: '',
    rating: 1620,
    group: 'A',
  },
  {
    id: 'kor',
    name: 'Korea Republic',
    code: 'KOR',
    flag: '',
    rating: 1780,
    group: 'A',
  },
  {
    id: 'cze',
    name: 'Czechia',
    code: 'CZE',
    flag: '',
    rating: 1740,
    group: 'A',
  },

  // Group B
  {
    id: 'can',
    name: 'Canada',
    code: 'CAN',
    flag: '',
    rating: 1790,
    group: 'B',
  },
  {
    id: 'bih',
    name: 'Bosnia and Herzegovina',
    code: 'BIH',
    flag: '',
    rating: 1680,
    group: 'B',
  },
  { id: 'qat', name: 'Qatar', code: 'QAT', flag: '', rating: 1540, group: 'B' },
  {
    id: 'sui',
    name: 'Switzerland',
    code: 'SUI',
    flag: '',
    rating: 1810,
    group: 'B',
  },

  // Group C
  {
    id: 'bra',
    name: 'Brazil',
    code: 'BRA',
    flag: '',
    rating: 2050,
    group: 'C',
  },
  {
    id: 'mar',
    name: 'Morocco',
    code: 'MAR',
    flag: '',
    rating: 1840,
    group: 'C',
  },
  {
    id: 'sco',
    name: 'Scotland',
    code: 'SCO',
    flag: '',
    rating: 1710,
    group: 'C',
  },
  { id: 'hai', name: 'Haiti', code: 'HAI', flag: '', rating: 1500, group: 'C' },

  // Group D
  {
    id: 'usa',
    name: 'United States',
    code: 'USA',
    flag: '',
    rating: 1830,
    group: 'D',
  },
  {
    id: 'par',
    name: 'Paraguay',
    code: 'PAR',
    flag: '',
    rating: 1710,
    group: 'D',
  },
  {
    id: 'aus',
    name: 'Australia',
    code: 'AUS',
    flag: '',
    rating: 1720,
    group: 'D',
  },
  {
    id: 'tur',
    name: 'Turkiye',
    code: 'TUR',
    flag: '',
    rating: 1790,
    group: 'D',
  },

  // Group E
  {
    id: 'ger',
    name: 'Germany',
    code: 'GER',
    flag: '',
    rating: 1970,
    group: 'E',
  },
  {
    id: 'ecu',
    name: 'Ecuador',
    code: 'ECU',
    flag: '',
    rating: 1730,
    group: 'E',
  },
  {
    id: 'civ',
    name: 'Ivory Coast',
    code: 'CIV',
    flag: '',
    rating: 1690,
    group: 'E',
  },
  {
    id: 'cuw',
    name: 'Curacao',
    code: 'CUW',
    flag: '',
    rating: 1500,
    group: 'E',
  },

  // Group F
  {
    id: 'ned',
    name: 'Netherlands',
    code: 'NED',
    flag: '',
    rating: 1950,
    group: 'F',
  },
  { id: 'jpn', name: 'Japan', code: 'JPN', flag: '', rating: 1820, group: 'F' },
  {
    id: 'swe',
    name: 'Sweden',
    code: 'SWE',
    flag: '',
    rating: 1800,
    group: 'F',
  },
  {
    id: 'tun',
    name: 'Tunisia',
    code: 'TUN',
    flag: '',
    rating: 1640,
    group: 'F',
  },

  // Group G
  {
    id: 'bel',
    name: 'Belgium',
    code: 'BEL',
    flag: '',
    rating: 1930,
    group: 'G',
  },
  { id: 'egy', name: 'Egypt', code: 'EGY', flag: '', rating: 1700, group: 'G' },
  { id: 'irn', name: 'Iran', code: 'IRN', flag: '', rating: 1710, group: 'G' },
  {
    id: 'nzl',
    name: 'New Zealand',
    code: 'NZL',
    flag: '',
    rating: 1500,
    group: 'G',
  },

  // Group H
  { id: 'esp', name: 'Spain', code: 'ESP', flag: '', rating: 2060, group: 'H' },
  {
    id: 'cpv',
    name: 'Cape Verde',
    code: 'CPV',
    flag: '',
    rating: 1580,
    group: 'H',
  },
  {
    id: 'ksa',
    name: 'Saudi Arabia',
    code: 'KSA',
    flag: '',
    rating: 1620,
    group: 'H',
  },
  {
    id: 'uru',
    name: 'Uruguay',
    code: 'URU',
    flag: '',
    rating: 1880,
    group: 'H',
  },

  // Group I
  {
    id: 'fra',
    name: 'France',
    code: 'FRA',
    flag: '',
    rating: 2080,
    group: 'I',
  },
  {
    id: 'sen',
    name: 'Senegal',
    code: 'SEN',
    flag: '',
    rating: 1790,
    group: 'I',
  },
  { id: 'irq', name: 'Iraq', code: 'IRQ', flag: '', rating: 1600, group: 'I' },
  {
    id: 'nor',
    name: 'Norway',
    code: 'NOR',
    flag: '',
    rating: 1800,
    group: 'I',
  },

  // Group J
  {
    id: 'arg',
    name: 'Argentina',
    code: 'ARG',
    flag: '',
    rating: 2100,
    group: 'J',
  },
  {
    id: 'alg',
    name: 'Algeria',
    code: 'ALG',
    flag: '',
    rating: 1700,
    group: 'J',
  },
  {
    id: 'aut',
    name: 'Austria',
    code: 'AUT',
    flag: '',
    rating: 1830,
    group: 'J',
  },
  {
    id: 'jor',
    name: 'Jordan',
    code: 'JOR',
    flag: '',
    rating: 1500,
    group: 'J',
  },

  // Group K
  {
    id: 'por',
    name: 'Portugal',
    code: 'POR',
    flag: '',
    rating: 2030,
    group: 'K',
  },
  {
    id: 'cod',
    name: 'DR Congo',
    code: 'COD',
    flag: '',
    rating: 1640,
    group: 'K',
  },
  {
    id: 'uzb',
    name: 'Uzbekistan',
    code: 'UZB',
    flag: '',
    rating: 1560,
    group: 'K',
  },
  {
    id: 'col',
    name: 'Colombia',
    code: 'COL',
    flag: '',
    rating: 1850,
    group: 'K',
  },

  // Group L
  {
    id: 'eng',
    name: 'England',
    code: 'ENG',
    flag: '',
    rating: 2010,
    group: 'L',
  },
  {
    id: 'cro',
    name: 'Croatia',
    code: 'CRO',
    flag: '',
    rating: 1860,
    group: 'L',
  },
  { id: 'gha', name: 'Ghana', code: 'GHA', flag: '', rating: 1660, group: 'L' },
  {
    id: 'pan',
    name: 'Panama',
    code: 'PAN',
    flag: '',
    rating: 1540,
    group: 'L',
  },
];

export const GROUP_IDS: GroupId[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
];

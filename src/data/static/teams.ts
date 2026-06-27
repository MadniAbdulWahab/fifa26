import type { GroupId, Team } from '@/domain/types';

/**
 * Sample World Cup 2026 field: 48 teams in 12 groups of 4.
 *
 * Ratings are approximate Elo-style strengths used ONLY by the advancement
 * simulation. Flags are emoji so the bundled data needs no image hosting.
 *
 * This is illustrative offline data. For the official draw and live results,
 * run the app with VITE_DATA_SOURCE=api (see README).
 */
export interface SeedTeam extends Team {
  group: GroupId;
}

export const SEED_TEAMS: SeedTeam[] = [
  // Group A
  { id: 'mex', name: 'Mexico', code: 'MEX', flag: '🇲🇽', rating: 1840, group: 'A' },
  { id: 'pol', name: 'Poland', code: 'POL', flag: '🇵🇱', rating: 1760, group: 'A' },
  { id: 'ksa', name: 'Saudi Arabia', code: 'KSA', flag: '🇸🇦', rating: 1620, group: 'A' },
  { id: 'nzl', name: 'New Zealand', code: 'NZL', flag: '🇳🇿', rating: 1500, group: 'A' },

  // Group B
  { id: 'can', name: 'Canada', code: 'CAN', flag: '🇨🇦', rating: 1790, group: 'B' },
  { id: 'bel', name: 'Belgium', code: 'BEL', flag: '🇧🇪', rating: 1930, group: 'B' },
  { id: 'kor', name: 'South Korea', code: 'KOR', flag: '🇰🇷', rating: 1780, group: 'B' },
  { id: 'egy', name: 'Egypt', code: 'EGY', flag: '🇪🇬', rating: 1700, group: 'B' },

  // Group C
  { id: 'usa', name: 'United States', code: 'USA', flag: '🇺🇸', rating: 1830, group: 'C' },
  { id: 'wal', name: 'Wales', code: 'WAL', flag: '🏴', rating: 1720, group: 'C' },
  { id: 'irn', name: 'Iran', code: 'IRN', flag: '🇮🇷', rating: 1710, group: 'C' },
  { id: 'gha', name: 'Ghana', code: 'GHA', flag: '🇬🇭', rating: 1660, group: 'C' },

  // Group D
  { id: 'arg', name: 'Argentina', code: 'ARG', flag: '🇦🇷', rating: 2100, group: 'D' },
  { id: 'aus', name: 'Australia', code: 'AUS', flag: '🇦🇺', rating: 1720, group: 'D' },
  { id: 'civ', name: 'Ivory Coast', code: 'CIV', flag: '🇨🇮', rating: 1690, group: 'D' },
  { id: 'uzb', name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', rating: 1560, group: 'D' },

  // Group E
  { id: 'fra', name: 'France', code: 'FRA', flag: '🇫🇷', rating: 2080, group: 'E' },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag: '🇸🇳', rating: 1790, group: 'E' },
  { id: 'jpn', name: 'Japan', code: 'JPN', flag: '🇯🇵', rating: 1820, group: 'E' },
  { id: 'crc', name: 'Costa Rica', code: 'CRC', flag: '🇨🇷', rating: 1560, group: 'E' },

  // Group F
  { id: 'bra', name: 'Brazil', code: 'BRA', flag: '🇧🇷', rating: 2050, group: 'F' },
  { id: 'sui', name: 'Switzerland', code: 'SUI', flag: '🇨🇭', rating: 1810, group: 'F' },
  { id: 'cmr', name: 'Cameroon', code: 'CMR', flag: '🇨🇲', rating: 1650, group: 'F' },
  { id: 'qat', name: 'Qatar', code: 'QAT', flag: '🇶🇦', rating: 1540, group: 'F' },

  // Group G
  { id: 'eng', name: 'England', code: 'ENG', flag: '🏴', rating: 2010, group: 'G' },
  { id: 'ecu', name: 'Ecuador', code: 'ECU', flag: '🇪🇨', rating: 1730, group: 'G' },
  { id: 'srb', name: 'Serbia', code: 'SRB', flag: '🇷🇸', rating: 1760, group: 'G' },
  { id: 'pan', name: 'Panama', code: 'PAN', flag: '🇵🇦', rating: 1540, group: 'G' },

  // Group H
  { id: 'esp', name: 'Spain', code: 'ESP', flag: '🇪🇸', rating: 2060, group: 'H' },
  { id: 'cro', name: 'Croatia', code: 'CRO', flag: '🇭🇷', rating: 1860, group: 'H' },
  { id: 'mar', name: 'Morocco', code: 'MAR', flag: '🇲🇦', rating: 1840, group: 'H' },
  { id: 'jor', name: 'Jordan', code: 'JOR', flag: '🇯🇴', rating: 1500, group: 'H' },

  // Group I
  { id: 'por', name: 'Portugal', code: 'POR', flag: '🇵🇹', rating: 2030, group: 'I' },
  { id: 'uru', name: 'Uruguay', code: 'URU', flag: '🇺🇾', rating: 1880, group: 'I' },
  { id: 'nga', name: 'Nigeria', code: 'NGA', flag: '🇳🇬', rating: 1730, group: 'I' },
  { id: 'nor', name: 'Norway', code: 'NOR', flag: '🇳🇴', rating: 1800, group: 'I' },

  // Group J
  { id: 'ger', name: 'Germany', code: 'GER', flag: '🇩🇪', rating: 1970, group: 'J' },
  { id: 'col', name: 'Colombia', code: 'COL', flag: '🇨🇴', rating: 1850, group: 'J' },
  { id: 'tun', name: 'Tunisia', code: 'TUN', flag: '🇹🇳', rating: 1640, group: 'J' },
  { id: 'hon', name: 'Honduras', code: 'HON', flag: '🇭🇳', rating: 1520, group: 'J' },

  // Group K
  { id: 'ned', name: 'Netherlands', code: 'NED', flag: '🇳🇱', rating: 1950, group: 'K' },
  { id: 'den', name: 'Denmark', code: 'DEN', flag: '🇩🇰', rating: 1820, group: 'K' },
  { id: 'alg', name: 'Algeria', code: 'ALG', flag: '🇩🇿', rating: 1700, group: 'K' },
  { id: 'jam', name: 'Jamaica', code: 'JAM', flag: '🇯🇲', rating: 1560, group: 'K' },

  // Group L
  { id: 'ita', name: 'Italy', code: 'ITA', flag: '🇮🇹', rating: 1940, group: 'L' },
  { id: 'ukr', name: 'Ukraine', code: 'UKR', flag: '🇺🇦', rating: 1740, group: 'L' },
  { id: 'mli', name: 'Mali', code: 'MLI', flag: '🇲🇱', rating: 1640, group: 'L' },
  { id: 'cuw', name: 'Curaçao', code: 'CUW', flag: '🇨🇼', rating: 1500, group: 'L' },
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

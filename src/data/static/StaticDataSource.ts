import type { DataSource } from '@/data/DataSource';
import type { Match, Team } from '@/domain/types';
import { buildKnockoutMatches } from '@/lib/bracket';
import { flagUrl } from '@/lib/flags';
import { buildStandings } from '@/lib/standings';
import { generateGroupMatches } from './schedule';
import { SEED_TEAMS } from './teams';

/**
 * Offline data source backed by bundled fixture data. Needs no API key, works
 * offline, and is deterministic — ideal for development and demos.
 *
 * Group matches are scheduled only. Knockout fixtures remain placeholders until
 * real group results are supplied by a live feed or maintained results file.
 */
export class StaticDataSource implements DataSource {
  private readonly teams: Team[] = SEED_TEAMS.map(
    ({ group: _group, ...team }) => ({ ...team, flag: flagUrl(team.code) }),
  );

  private readonly matches: Match[];

  constructor() {
    const groupMatches = generateGroupMatches();
    const standings = buildStandings(this.teams, groupMatches);
    const knockoutMatches = buildKnockoutMatches(standings);
    this.matches = [...groupMatches, ...knockoutMatches];
  }

  async getTeams(): Promise<Team[]> {
    return this.teams;
  }

  async getMatches(): Promise<Match[]> {
    return this.matches;
  }
}

import type { DataSource } from '@/data/DataSource';
import type { Match, Team } from '@/domain/types';
import { buildKnockoutMatches } from '@/lib/bracket';
import { buildStandings } from '@/lib/standings';
import { generateGroupMatches } from './schedule';
import { SEED_TEAMS } from './teams';

/**
 * Offline data source backed by bundled sample data. Needs no API key, works
 * offline, and is fully deterministic — ideal for development and demos.
 *
 * Group matches are generated with sample scores; knockout fixtures are then
 * derived from the resulting standings so the bracket is internally consistent.
 */
export class StaticDataSource implements DataSource {
  private readonly teams: Team[] = SEED_TEAMS.map(
    ({ group: _group, ...team }) => team,
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

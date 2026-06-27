import { Link } from 'react-router-dom';
import type { Team } from '@/domain/types';
import { TBD_TEAM_ID } from '@/lib/bracket';

interface TeamBadgeProps {
  team: Team | undefined;
  /** Show the full name instead of the 3-letter code. */
  full?: boolean;
  /** Wrap in a link to the team page. */
  link?: boolean;
  className?: string;
}

function Crest({ team }: { team: Team | undefined }) {
  if (!team) return <span aria-hidden>⚪</span>;
  if (team.flag.startsWith('http')) {
    return (
      <img
        src={team.flag}
        alt=""
        className="h-5 w-5 rounded-sm object-contain"
        loading="lazy"
      />
    );
  }
  return <span aria-hidden>{team.flag}</span>;
}

export function TeamBadge({ team, full, link, className }: TeamBadgeProps) {
  const label = team ? (full ? team.name : team.code) : 'TBD';
  const content = (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Crest team={team} />
      <span className={full ? 'font-medium' : 'font-semibold'}>{label}</span>
    </span>
  );

  if (link && team && team.id !== TBD_TEAM_ID) {
    return (
      <Link to={`/team/${team.id}`} className="hover:text-brand">
        {content}
      </Link>
    );
  }
  return content;
}

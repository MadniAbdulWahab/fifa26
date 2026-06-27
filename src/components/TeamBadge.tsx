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
        width={24}
        height={16}
        className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/5"
        loading="lazy"
      />
    );
  }
  if (team.flag) return <span aria-hidden>{team.flag}</span>;
  return <span aria-hidden>⚪</span>;
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

import { Route, Routes } from 'react-router-dom';
import { useLoadState } from './TournamentContext';
import { Nav } from './Nav';
import { FixturesPage } from '@/pages/FixturesPage';
import { StandingsPage } from '@/pages/StandingsPage';
import { BracketPage } from '@/pages/BracketPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { TeamPage } from '@/pages/TeamPage';

export default function App() {
  const { isLoading, error } = useLoadState();

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <Nav />
      <main className="flex-1 px-4 pb-24 pt-4 sm:pb-8">
        {error ? (
          <ErrorState message={error.message} />
        ) : isLoading ? (
          <LoadingState />
        ) : (
          <Routes>
            <Route path="/" element={<FixturesPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/bracket" element={<BracketPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/team/:id" element={<TeamPage />} />
            <Route path="*" element={<FixturesPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card h-20 animate-pulse opacity-60" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="text-lg font-semibold">Couldn’t load tournament data</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <p className="mt-4 text-sm text-slate-500">
        If you’re using the live API, check your token and proxy in the README.
      </p>
    </div>
  );
}

import { NovaBlock } from "@/components/nova/NovaBlock";
import { ClubRow } from "@/components/esports/ClubRow";
import { getTeam } from "@/lib/data";
import { resolveTournamentParticipants } from "@/lib/data/tournament-stats";

interface TournamentParticipantsProps {
  slug: string;
}

export function TournamentParticipants({ slug }: TournamentParticipantsProps) {
  const slugs = resolveTournamentParticipants(slug);
  if (!slugs.length) return null;

  const participantTeams = slugs
    .map((s) => getTeam(s))
    .filter(Boolean)
    .sort((a, b) => a!.rank - b!.rank);

  return (
    <NovaBlock title={`Participantes (${slugs.length})`}>
      <table className="es-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th>Región</th>
          </tr>
        </thead>
        <tbody>
          {participantTeams.map((team) =>
            team ? (
              <ClubRow key={team.slug} team={team} showForm={false} showEarnings={false} />
            ) : null,
          )}
        </tbody>
      </table>
    </NovaBlock>
  );
}

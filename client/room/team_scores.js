export const TEAM_SCORES_MUL = 0.08;
const SCORES_PROP_NAME = "Scores";

export function addTeamScores(team, playerScoresToScale) {
    if (!team) return;

    const scaled = Math.round((playerScoresToScale | 0) * TEAM_SCORES_MUL);
    if (scaled <= 0) return;

    const teamProp = team.Properties
        ? team.Properties.Get(SCORES_PROP_NAME)
        : null;

    if (teamProp) teamProp.Value += scaled;
}

export function addTeamScoresRaw(team, teamScores) {
    if (!team) return;

    const add = teamScores | 0;
    if (add === 0) return;

    const teamProp = team.Properties
        ? team.Properties.Get(SCORES_PROP_NAME)
        : null;

    if (teamProp) teamProp.Value += add;
}
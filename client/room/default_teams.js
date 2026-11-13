import { Color } from 'pixel_combats/basic';
import { Teams } from 'pixel_combats/room';

export const RED_TEAM_NAME = "Red";
export const BLUE_TEAM_NAME = "Blue";

export function create_team_blue() {
    Teams.Add("Blue", "Teams/Blue", new Color(0, 0, 1, 0));
    const team = Teams.Get("Blue");
    team.Spawns.SpawnPointsGroups.Add(1);
    return team;
}

export function create_team_red() {
    Teams.Add("Red", "Teams/Red", new Color(1, 0, 0, 0));
    const team = Teams.Get("Red");
    team.Spawns.SpawnPointsGroups.Add(2);
    return team;
}
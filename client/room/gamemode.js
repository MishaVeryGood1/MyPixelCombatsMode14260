import { DisplayValueHeader } from 'pixel_combats/basic';
import * as room_lib from 'pixel_combats/room';

const {
    room, Game, Players, Inventory, LeaderBoard,
    BuildBlocksSet, Teams, Damage, BreackGraph, Ui,
    Properties, GameMode, Spawns, Timers, TeamsBalancer,
    NewGame, NewGameVote, MapEditor
} = room_lib;

import * as teams from './default_teams.js';
import * as damageScores from './damage_scores.js';
import * as mapScores from './map_scores.js';
import { addTeamScores } from './team_scores.js';

room.PopupsEnable = true;

// ВРЕМЯ ПОДГОТОВКИ
const WaitingPlayersTime = 10;
const TacticalPreparationTime = 30;

const KILLS_PROP_NAME = "Kills";
const SCORES_PROP_NAME = "Scores";

const WaitingStateValue = "Waiting";
const TacticalPreparationStateValue = "TacticalPreparation";
const GameStateValue = "Game";

const immortalityTimerName = "immortality";

// ТАЙМЕРЫ
const mainTimer = Timers.GetContext().Get("Main");
const scores_timer = Timers.GetContext().Get("Scores");
const elapsedTimer = Timers.GetContext().Get("ElapsedClock");

const stateProp = Properties.GetContext().Get("State");

// ПАРАМЕТРЫ РЕЖИМА
Damage.GetContext().FriendlyFire.Value =
    GameMode.Parameters.GetBool("FriendlyFire");

BreackGraph.WeakBlocks =
    GameMode.Parameters.GetBool("LoosenBlocks");

BreackGraph.OnlyPlayerBlocksDmg =
    GameMode.Parameters.GetBool("OnlyPlayerBlocksDmg");

BreackGraph.PlayerBlockBoost = true;

Properties.GetContext().GameModeName.Value =
    "GameModes/Team Dead Match";

TeamsBalancer.IsAutoBalance = true;

Ui.GetContext().MainTimerId.Value = mainTimer.Id;

// СОЗДАНИЕ КОМАНД
const blueTeam = teams.create_team_blue();
const redTeam = teams.create_team_red();

blueTeam.Build.BlocksSet.Value = BuildBlocksSet.Blue;
redTeam.Build.BlocksSet.Value = BuildBlocksSet.Red;

// ТАБЛИЦА ИГРОКОВ
LeaderBoard.PlayerLeaderBoardValues = [
    new DisplayValueHeader(
        KILLS_PROP_NAME,
        "Statistics/Kills",
        "Statistics/KillsShort"
    ),
    new DisplayValueHeader(
        "Deaths",
        "Statistics/Deaths",
        "Statistics/DeathsShort"
    ),
    new DisplayValueHeader(
        "Spawns",
        "Statistics/Spawns",
        "Statistics/SpawnsShort"
    ),
    new DisplayValueHeader(
        SCORES_PROP_NAME,
        "Statistics/Scores",
        "Statistics/ScoresShort"
    )
];

LeaderBoard.TeamLeaderBoardValue =
    new DisplayValueHeader(
        SCORES_PROP_NAME,
        "Statistics\\Scores",
        "Statistics\\Scores"
    );

LeaderBoard.TeamWeightGetter.Set(function(team) {
    return team.Properties.Get(SCORES_PROP_NAME).Value;
});

LeaderBoard.PlayersWeightGetter.Set(function(player) {
    return player.Properties.Get(SCORES_PROP_NAME).Value;
});

redTeam.Properties.Get(SCORES_PROP_NAME).Value = 0;
blueTeam.Properties.Get(SCORES_PROP_NAME).Value = 0;

Ui.GetContext().TeamProp1.Value = {
    Team: "Blue",
    Prop: SCORES_PROP_NAME
};

Ui.GetContext().TeamProp2.Value = {
    Team: "Red",
    Prop: SCORES_PROP_NAME
};

// ВЫБОР КОМАНД
Teams.OnRequestJoinTeam.Add(function(player, team) {
    team.Add(player);
});

Teams.OnPlayerChangeTeam.Add(function(player) {
    player.Spawns.Spawn();
});

// БЕССМЕРТИЕ ПОСЛЕ ВОЗРОЖДЕНИЯ
Spawns.GetContext().OnSpawn.Add(function(player) {
    player.Properties.Immortality.Value = true;
    player.Timers.Get(immortalityTimerName).Restart(3);
});

Timers.OnPlayerTimer.Add(function(timer) {
    if (timer.Id != immortalityTimerName) return;

    timer.Player.Properties.Immortality.Value = false;
});

// СТАТИСТИКА СПАВНОВ
Spawns.OnSpawn.Add(function(player) {
    ++player.Properties.Spawns.Value;
});

// СТАТИСТИКА СМЕРТЕЙ
Damage.OnDeath.Add(function(player) {
    ++player.Properties.Deaths.Value;
});

// ОЧКИ ЗА УБИЙСТВА
Damage.OnKillReport.Add(function(victim, killer, report) {
    damageScores.applyKillReportScores(victim, killer, report);
});

// ОЧКИ ЗА ИЗМЕНЕНИЕ КАРТЫ
MapEditor.OnMapEdited.Add(function(player, details) {
    mapScores.applyMapEditScores(
        player,
        details,
        blueTeam,
        redTeam
    );
});

// ОЧКИ ЗА ВРЕМЯ В ИГРЕ
scores_timer.OnTimer.Add(function() {
    if (stateProp.Value !== GameStateValue) return;

    for (const player of Players.All) {
        if (player.Team == null) continue;

        player.Properties.Scores.Value += 30;
        addTeamScores(player.Team, 30);
    }
});

// ПЕРЕКЛЮЧЕНИЕ СОСТОЯНИЙ
mainTimer.OnTimer.Add(function() {
    switch (stateProp.Value) {
        case WaitingStateValue:
            SetTacticalPreparation();
            break;

        case TacticalPreparationStateValue:
            SetGameMode();
            break;

        case GameStateValue:
            // Матч бесконечный.
            // Автоматическое завершение отключено.
            break;
    }
});

// ОЖИДАНИЕ ИГРОКОВ
function SetWaitingMode() {
    stateProp.Value = WaitingStateValue;

    Ui.GetContext().Hint.Value = "Hint/WaitingPlayers";

    Spawns.GetContext().enable = false;

    mainTimer.Restart(WaitingPlayersTime);
}

// ПОДГОТОВКА
function SetTacticalPreparation() {
    stateProp.Value = TacticalPreparationStateValue;

    Ui.GetContext().Hint.Value = "Hint/TacticalPrep";

    const inventory = Inventory.GetContext();

    inventory.Main.Value = false;
    inventory.Secondary.Value = false;
    inventory.Melee.Value = true;
    inventory.Explosive.Value = false;
    inventory.Build.Value = true;

    Damage.GetContext().DamageOut.Value = true;

    Spawns.GetContext().RespawnTime.Value = 0;

    mainTimer.Restart(TacticalPreparationTime);

    Spawns.GetContext().enable = true;

    SpawnTeams();
}

// НАЧАЛО БЕСКОНЕЧНОГО МАТЧА
function SetGameMode() {
    stateProp.Value = GameStateValue;

    Damage.GetContext().DamageOut.Value = true;

    const inventory = Inventory.GetContext();

    if (GameMode.Parameters.GetBool("OnlyKnives")) {
        inventory.Main.Value = false;
        inventory.Secondary.Value = false;
        inventory.Melee.Value = true;
        inventory.Explosive.Value = false;
        inventory.Build.Value = true;
    } else {
        inventory.Main.Value = true;
        inventory.Secondary.Value = true;
        inventory.Melee.Value = true;
        inventory.Explosive.Value = true;
        inventory.Build.Value = true;
    }

    Spawns.GetContext().RespawnTime.Value = 0;

    Spawns.GetContext().Despawn();

    SpawnTeams();

    // СЧЁТЧИК ВРЕМЕНИ
    elapsedSeconds = 0;

    Ui.GetContext().Hint.Value = "Время: 00:00:00";

    elapsedTimer.RestartLoop(1);
}

// СЧЁТЧИК ВВЕРХ
var elapsedSeconds = 0;

function UpdateElapsedClock() {
    if (stateProp.Value !== GameStateValue) return;

    elapsedSeconds++;

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const s = String(seconds).padStart(2, "0");

    Ui.GetContext().Hint.Value =
        "Время: " + h + ":" + m + ":" + s;
}

elapsedTimer.OnTimer.Add(function() {
    UpdateElapsedClock();
});

// ВОЗРОЖДЕНИЕ КОМАНД
function SpawnTeams() {
    for (const team of Teams) {
        Spawns.GetContext(team).Spawn();
    }
}

// ЗАПУСК
scores_timer.RestartLoop(30);

SetWaitingMode();
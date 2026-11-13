import * as teams from './default_teams.js';

// ==================================
// СОЗДАНИЕ КОМАНД
// ==================================

teams.create_team_blue();
teams.create_team_red();

// ==================================
// ВЫБОР КОМАНДЫ
// ==================================

Teams.OnRequestJoinTeam.Add(function(player, team) {
    team.Add(player);
});

// Возрождение после смены команды
Teams.OnPlayerChangeTeam.Add(function(player) {
    player.Spawns.Spawn();
});

// ==================================
// МГНОВЕННОЕ ВОЗРОЖДЕНИЕ
// ==================================

Spawns.GetContext().RespawnTime.Value = 0;

// ==================================
// БЕСКОНЕЧНЫЙ СЧЁТЧИК ВРЕМЕНИ
// ==================================

var elapsedSeconds = 0;

var clock = Timers.GetContext().Get("ElapsedClock");

function updateClock() {
    elapsedSeconds++;

    var hours = Math.floor(elapsedSeconds / 3600);
    var minutes = Math.floor((elapsedSeconds % 3600) / 60);
    var seconds = elapsedSeconds % 60;

    var hourText = (hours < 10 ? "0" : "") + hours;
    var minuteText = (minutes < 10 ? "0" : "") + minutes;
    var secondText = (seconds < 10 ? "0" : "") + seconds;

    Ui.GetContext().Hint.Value =
        "Время: " + hourText + ":" + minuteText + ":" + secondText;
}

// Начальное отображение
Ui.GetContext().Hint.Value = "Время: 00:00:00";

// Обновление каждую секунду
clock.OnTimer.Add(function() {
    updateClock();
});

clock.RestartLoop(1);
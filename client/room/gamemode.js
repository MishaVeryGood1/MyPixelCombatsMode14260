Teams.OnRequestJoinTeam.Add(function(player, team) {
    team.Add(player);
});

Teams.OnPlayerChangeTeam.Add(function(player) {
    player.Spawns.Spawn();
});

Teams.Add("Blue", "Teams/Blue", { b: 1 });
Teams.Add("Red", "Teams/Red", { r: 1 });

Teams.Get("Blue").Spawns.SpawnPointsGroups.Add(1);
Teams.Get("Red").Spawns.SpawnPointsGroups.Add(2);

Spawns.GetContext().RespawnTime.Value = 0;

// Счётчик времени вверх
var elapsedSeconds = 0;

var clock = Timers.GetContext().Get("ElapsedClock");

function updateClock() {
    elapsedSeconds++;

    var minutes = Math.floor(elapsedSeconds / 60);
    var seconds = elapsedSeconds % 60;

    var minuteText = (minutes < 10 ? "0" : "") + minutes;
    var secondText = (seconds < 10 ? "0" : "") + seconds;

    Ui.GetContext().Hint.Value =
        "Время: " + minuteText + ":" + secondText;
}

Ui.GetContext().Hint.Value = "Время: 00:00";

clock.OnTimer.Add(function() {
    updateClock();
});

clock.RestartLoop(1);
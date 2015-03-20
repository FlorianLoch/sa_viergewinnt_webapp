var BASE_URL = "/api";
var gameLog;
var uuid = "";

$(function () {
    var blockInput = false;

    //Register global callback for blocking input during requests
    $(document).ajaxStart(function () {
        $("#board").css({
            cursor: "not-allowed"
        });
        blockInput = true;
    });

    $(document).ajaxStop(function () {
        $("#board").css({
            cursor: "pointer"
        });
        blockInput = false;
    });

    function newGameHandler(fnCallback, playerBegins) {
        $.ajax({
            url: BASE_URL + "/game",
            success: function (data) {
                gameLog = [];

                uuid = data.uuid;
                console.log("UUID: " + uuid);

                if (!playerBegins) {
                    var turn = {};
                    turn.player = null;
                    turn.ai = data.ai_turn;
                    turn.isRemi = false;
                    turn.isPlayerWinner = false;
                    turn.isAIWinner = false;

                    gameLog.push(data.ai_turn);

                    fnCallback(data.ai_turn.toUpperCase().charCodeAt(0) - 65);
                    return;
                }

                fnCallback();
            },
            data: JSON.stringify({
                player_begins: playerBegins,
                ai_algorithm: "alphaBetaAI" //other possibilities would be: easyAI_noRandom, easyAI
            }),
            contentType: "application/json",
            type: "PUT"
        });
    }

    function turnHandler(sPlayerTurn, fnCallback) {
        var turn = {};

        turn.player = sPlayerTurn;

        $.ajax({
            url: BASE_URL + "/game/" + uuid,
            success: function (data) {
                var isRemi = data.remis || false;
                var isPlayerWinner = data.player_won || false;
                var isAIWinner = data.ai_won || false;
                var aiTurn = data.ai_turn || "";
                var arWinningStreak = data.winning_streak;

                turn.ai = aiTurn;
                turn.isRemi = isRemi;
                turn.isPlayerWinner = isPlayerWinner;
                turn.isAIWinner = isAIWinner;

                gameLog.push(turn);

                fnCallback(new TurnSummary(isAIWinner, isPlayerWinner, isRemi, aiTurn, arWinningStreak));
            },
            data: JSON.stringify({
                player_turn: sPlayerTurn
            }),
            contentType: "application/json",
            type: "POST"
        });
    }

    function isInputBlockedHandler() {
        return blockInput;
    }


    var gameboard = new Gameboard("#board", isInputBlockedHandler, newGameHandler, turnHandler);

    $(document).on("keyup", function (event) {
        event.preventDefault();

        if ("L".charCodeAt(0) == event.which) {
            showMinimizedLog();
        }

        else if ("R".charCodeAt(0) == event.which) {
            gameboard.resetGame();
        }

        var column = event.which - 65;
        if (column >= 0 && column <= 6) {
            gameboard.addTile(column, false);
        }
    });
});

function showMinimizedLog() {
    var output = uuid;
    for (var i = 0; i < gameLog.length; i++) {
        output += gameLog[i].player + ";" + gameLog[i].ai;
        if (i + 1 < gameLog.length) output += "$";
    }

    window.prompt("Please copy via STRG+C / CMD+C", output);
}
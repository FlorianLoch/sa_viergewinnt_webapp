var BASE_URL = "";
var gameLog = [];
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

    function newGameHandler(fnCallback) {
        $.ajax({
            url: BASE_URL + "/newGame",
            success: function (data) {
                uuid = data.uuid;
                console.log("UUID: " + uuid);

                fnCallback();
            },
            data: JSON.stringify({
                player_begins: true,
                ai: "alphaBetaAI" //other possibilities would be: easyAI_noRandom, easyAI
            }),
            type: "POST"
        });
    }

    function turnHandler(sPlayerTurn, fnCallback) {
        var turn = {};

        turn.player = sPlayerTurn;

        $.ajax({
            url: BASE_URL + "/doTurn",
            success: function (data) {
                var isRemi = data.is_remi || false;
                var isPlayerWinner = data.is_won_by_player || false;
                var isAIWinner = data.is_won_by_ai || false;
                var aiTurn = data.ai_turn || "";

                turn.ai = aiTurn;
                turn.isRemi = isRemi;
                turn.isPlayerWinner = isPlayerWinner;
                turn.isAIWinner = isAIWinner;

                gameLog.push(turn);

                fnCallback(new TurnSummary(isAIWinner, isPlayerWinner, isRemi, aiTurn));
            },
            data: JSON.stringify({
                uuid: uuid,
                player_turn: sPlayerTurn
            }),
            type: "POST"
        });
    }

    function isInputBlockedHandler() {
        return blockInput;
    }

    new Gameboard("#board", isInputBlockedHandler, newGameHandler, turnHandler);
});

function showLog() {
    window.prompt("Please copy via STRG+C / CMD+C", JSON.stringify(gameLog));
}

function showMinimizedLog() {
    var output = uuid;
    for (var i = 0; i < gameLog.length; i++) {
        output += gameLog[i].player + ";" + gameLog[i].ai;
        if (i + 1 < gameLog.length) output += "$";
    }

    window.prompt("Please copy via STRG+C / CMD+C", output);
}
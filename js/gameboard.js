// gameboard.js
"use strict";

function TurnSummary(bAIWon, bPlayerWon, bRemi, sAITurn, arWinningStreak) {
    this.isAIWinner = function () {
        return bAIWon;
    };

    this.isRemi = function () {
        return bRemi;
    };

    this.isPlayerWinner = function () {
        return bPlayerWon;
    };

    this.getColumnOfAITurn = function () {
        return sAITurn.toUpperCase().charCodeAt(0) - 65;
    };

    this.getWinningStreak = function () {
        return arWinningStreak;
    };
}

function Gameboard(sContainerId, fnIsInputBlockedHandler, fnNewGameHandler, fnTurnHandler) {
    var self = this,
        arBoard = [],
        arColumnNames = [],
        oBoard = $(sContainerId),
        moveCounter = 0,
        SLOT_HEIGHT,
        SLOT_WIDTH,
        TOTAL_WIDTH,
        TOTAL_HEIGHT,
        BUMPER_SIZE = 5,
        oClickSound,
        arAddHandlers = [],
        gameOver = false,
        playerBegins;

    SLOT_HEIGHT = 100;
    SLOT_WIDTH = 100;
    TOTAL_HEIGHT = SLOT_HEIGHT * 6 + BUMPER_SIZE * 7;
    TOTAL_WIDTH = SLOT_WIDTH * 7 + BUMPER_SIZE * 8;

    setUp();

    function showDoesPlayerStartsDialog(fnCallback) {
        var dialog = new BootstrapDialog({
            title: 'Who shall begin?',
            message: 'Please decide who should play the first turn!',
            buttons: [{
                label: 'Let me begin (1)',
                action: function(dialog) {
                    closeDialogAndContinue(true);
                },
                hotkey: "1".charCodeAt(0)
            }, {
                label: 'I don\'t care (2)',
                action: function(dialog) {
                    closeDialogAndContinue("random");
                },
                hotkey: "2".charCodeAt(0)
            }, {
                label: 'Let the computer begin (3)',
                action: function(dialog) {
                    closeDialogAndContinue(false);
                },
                hotkey: "3".charCodeAt(0)
            }]
        });
        dialog.open();

        function closeDialogAndContinue(playerStarts) {
            dialog.close();

            if ("random" == playerStarts) {
                playerStarts = (Math.random() < 0.5);
            }

            playerBegins = playerStarts;
            fnCallback(playerStarts);
        }
    }

    function setUp() {
        //Add "loading" add
        oBoard.addClass("loading");

        //Initialize sound
        oClickSound = new buzz.sound("sounds/click", {
            formats: ["ogg", "mp3"],
            preload: true
        });

        oBoard.empty();

        for (var i = 0; i < 6; i++) {
            arBoard[i] = [];

            for (var j = 0; j < 7; j++) {
                var oSlot = $("<div class='slot'>").css({
                    top: i * (BUMPER_SIZE + SLOT_HEIGHT) + BUMPER_SIZE,
                    left: j * (BUMPER_SIZE + SLOT_WIDTH) + BUMPER_SIZE,
                    height: SLOT_HEIGHT,
                    width: SLOT_WIDTH
                });
                oSlot.click(buildAddHandler(j));
                oBoard.append(oSlot);

                arBoard[i][j] = {
                    slot: oSlot,
                    set: false
                };
            }
        }

        for (var i = 0; i < 7; i++) {
            var oColName = $("<div class='columnName'>").css({
                position: "absolute",
                top: SLOT_HEIGHT / 2,
                left: "50%",
                transform: "translate(-50%, -50%)"
            }).text(String.fromCharCode(65 + i));

            arColumnNames.push({
                elem: oColName,
                top: SLOT_HEIGHT / 2
            });
            arBoard[5][i].slot.addClass("containsColumnName").append(oColName);
        }

        showDoesPlayerStartsDialog(function () {
            fnNewGameHandler(function (aiTurnColumn_i) {
                //Remove child nodes and loading class (during loading they might be used for displaying information)
                oBoard.removeClass("loading");

                if (aiTurnColumn_i != undefined) {
                    self.addTile(aiTurnColumn_i, true);
                }
            }, playerBegins);
        });
    }

    function buildAddHandler(iColumn) {
        if (arAddHandlers[iColumn] === undefined) {
            arAddHandlers[iColumn] = function () {
                self.addTile(iColumn);
            };
        }

        return arAddHandlers[iColumn];
    }

    function determineRowInColumn(iColumn) {
        var i;
        for (i = 5; i >= 0 && arBoard[i][iColumn].set === false; i--) {
        }
        return i + 1;
    }

    function computePosition(iColumn, iRow) {
        return {
            x: (iColumn) * (SLOT_WIDTH + BUMPER_SIZE) + BUMPER_SIZE,
            y: (6 - iRow - 1) * (SLOT_HEIGHT + BUMPER_SIZE) + BUMPER_SIZE
        };
    }

    this.addTile = function (iColumn, bAITurn) {
        if (fnIsInputBlockedHandler() && !bAITurn) return;

        //Reset game if over
        if (gameOver) {
            this.resetGame();
            return;
        }

        if (iColumn < 0 || iColumn > 6) throw new InvalidColumnError(iColumn);

        //Check whether this column is already full
        if (arBoard[5][iColumn].set === true) throw new ColumnFullError(iColumn);

        var iRow = determineRowInColumn(iColumn);
        var pos = computePosition(iColumn, iRow);

        var fieldName = indexToFieldName(iColumn, iRow);

        var oTile = $("<div id='" + fieldName + "' class='tile player" + (moveCounter % 2 + 1) + "'>");
        oBoard.append(oTile);
        oTile.css({
            top: -SLOT_HEIGHT,
            left: (iColumn) * (SLOT_WIDTH + BUMPER_SIZE) + BUMPER_SIZE,
            opacity: 0.2
        });
        oTile.click(buildAddHandler(iColumn));

        oClickSound.stop();
        oClickSound.play();

        oTile.animate({
            top: pos.y,
            left: pos.x,
            opacity: 1.0
        }, {
            duration: "slow",
            easing: "easeInOutCubic"
        });

        moveColumnNameUpwards(iColumn);

        arBoard[iRow][iColumn] = {
            set: true,
            player: (moveCounter % 2 + 1)
        };

        //Send turn to server (only if it is a player turn)
        if (!bAITurn) doAITurn(iColumn, iRow);

        //If this was move number 42, the game is over
        moveCounter++;
        if (moveCounter === 42) {
            console.info("Game is over!");
        }
    }

    function moveColumnNameUpwards(iColumn) {
        var columnName = arColumnNames[iColumn];

        if (5 == columnName.row) {
            columnName.elem.fadeOut();
            return;
        }

        var newTop = columnName.top - SLOT_HEIGHT - BUMPER_SIZE;
        columnName.top = newTop;

        moveColumnName(columnName, newTop);
    }

    function resetColumnName(iColumn) {
        var columnName = arColumnNames[iColumn];

        columnName.elem.fadeIn();

        var newTop = SLOT_HEIGHT / 2;
        columnName.top = newTop;

        moveColumnName(columnName, newTop);
    }

    function moveColumnName(oColumnName, iNewTop, fnDone) {
        oColumnName.elem.animate({
            top: iNewTop + "px"
        }, {
            duration: "slow",
            easing: "easeInOutCubic",

        });
    }

    function indexToFieldName(iColumn, iRow ){
        var fieldName = String.fromCharCode(65 + iColumn);
        fieldName = fieldName + (iRow + 1).toString();

        return fieldName;
    }

    function doAITurn(iColumn, iRow) {
        var sPlayerTurn;

        sPlayerTurn = indexToFieldName(iColumn, iRow);

        fnTurnHandler(sPlayerTurn, function (oTurnSummary) {
            //If the player won the ai doesn't calculate a turn anymore - so we cannot add it and have to check this before
            if (oTurnSummary.isPlayerWinner()) {
                self.celebrate((playerBegins) ? 1 : 2, oTurnSummary.getWinningStreak());
                gameOver = true;
                return;
            }

            self.addTile(oTurnSummary.getColumnOfAITurn(), true);

            if (oTurnSummary.isRemi()) {
                gameOver = true;
                return;
            }

            if (oTurnSummary.isAIWinner()) {
                self.celebrate((playerBegins) ? 2 : 1, oTurnSummary.getWinningStreak());
                gameOver = true;
                return;
            }
        });
    }

    this.celebrate = function (iPlayer, arWinningStreak) {
        arWinningStreak.forEach(function (sFieldName) {
           $("#" + sFieldName).addClass("winner");
        });

        $(".tile").not(".winner").addClass("looser");
        $(".tile").not(".winner").animate({
            "opacity": 0.3
        }, "slow", "linear");
    }

    this.resetGame = function () {
        showDoesPlayerStartsDialog(function () {
            fnNewGameHandler(function (aiTurnColumn_i) {
                $(".tile").each(function (iIndx) {
                    var self = $(this);
                    var coords = MathUtil.getRandomPlaceOnCircle(TOTAL_WIDTH / 2, TOTAL_HEIGHT / 2, TOTAL_WIDTH);

                    self.animate({
                        top: coords.y,
                        left: coords.x,
                        opacity: 0
                    }, {
                        duration: "slow",
                        easing: "swing",
                        done: function () {
                            self.remove();
                        }
                    });
                });

                for (var i = 0; i < 6; i++) {
                    arBoard[i] = [];
                    for (var j = 0; j < 7; j++) {
                        arBoard[i][j] = {
                            slot: undefined,
                            set: false
                        };
                    }
                }

                moveCounter = 0;
                gameOver = false;

                for (var i = 0; i < 7; i++) {
                    resetColumnName(i);
                }

                if (aiTurnColumn_i != undefined) {
                    self.addTile(aiTurnColumn_i, true);
                }
            }, playerBegins);
        });
    };
}

function errorFactory(sErrorName, fnMessage) {
    window[sErrorName] = function () {
        this.stack = new Error().stack;
        this.message = fnMessage.apply(fnMessage, arguments);
    };
    window[sErrorName].prototype = Object.create(Error.prototype);
    window[sErrorName].prototype.name = sErrorName;
    window[sErrorName].prototype.constructor = window[sErrorName];
}

errorFactory("ColumnFullError", function () {
    return "The given column (" + arguments[0] + ") is already filled up to the top!";
});

errorFactory("InvalidColumnError", function () {
    return "The given column (" + arguments[0] + ") is invalid!";
});

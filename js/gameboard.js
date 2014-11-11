// gameboard.js
"use strict";

function TurnSummary(bAIWon, bPlayerWon, bRemi, sAITurn) {
  this.isAIWinner = function() {
    return bAIWon;
  };

  this.isRemi = function() {
    return bRemi;
  };

  this.isPlayerWinner = function() {
    return bPlayerWon;
  };

  this.getColumnOfAITurn = function() {
    return sAITurn.toUpperCase().charCodeAt(0) - 65;
  };
}

function Gameboard(sContainerId, fnNewGameHandler, fnTurnHandler) {
  var self = this,
    arBoard = [],
    oBoard = $(sContainerId),
    moveCounter = 0,
    SLOT_HEIGHT,
    SLOT_WIDTH,
    TOTAL_WIDTH,
    TOTAL_HEIGHT,
    BUMPER_SIZE = 5,
    oClickSound,
    arAddHandlers = [],
    gameOver = false;
  setUp();

  SLOT_HEIGHT = 100;
  SLOT_WIDTH = 100;
  TOTAL_HEIGHT = SLOT_HEIGHT * 6 + BUMPER_SIZE * 7;
  TOTAL_WIDTH = SLOT_WIDTH * 7 + BUMPER_SIZE * 8;

  function setUp() {
    //Add "loading" add
    oBoard.addClass("loading");

    //Initialize sound
    oClickSound = new buzz.sound("sounds/click", {
      formats: ["ogg", "mp3"],
      preload: true
    });

    fnNewGameHandler(function() {
      //Remove child nodes and loading class (during loading they might be used for displaying information)
      oBoard.removeClass("loading");
      oBoard.empty();

      oBoard.after($("<button>Celebrate</button>").click(function() {
        self.celebrate(1);
      }));
      oBoard.after($("<button>Clean Up</button>").click(function() {
        self.resetGame();
      }));

      for (var i = 0; i < 6; i++) {
        arBoard[i] = [];

        for (var j = 0; j < 7; j++) {
          var oSlot = $("<div class='slot'>").css({
            top:  i * (BUMPER_SIZE + SLOT_HEIGHT) + BUMPER_SIZE,
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
    });
  }

  function buildAddHandler(iColumn) {
    if (arAddHandlers[iColumn] === undefined) {
      arAddHandlers[iColumn] = function() {
        self.addTile(iColumn);
      };
    }

    return arAddHandlers[iColumn];
  }

  function determineRowInColumn(iColumn) {
    var i;
    for (i = 5; i >= 0 && arBoard[i][iColumn].set === false; i--) {}
    return i + 1;
  }

  function computePosition(iColumn, iRow) {
    return {
      x: (iColumn) * (SLOT_WIDTH + BUMPER_SIZE) + BUMPER_SIZE,
      y: (6 - iRow - 1) * (SLOT_HEIGHT + BUMPER_SIZE) + BUMPER_SIZE
    };
  }

  this.addTile = function(iColumn, bAITurn) {
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

    //Send turn to server (only if it is a player turn)
    if (!bAITurn) doAITurn(iColumn, iRow);

    var oTile = $("<div class='tile player" + (moveCounter % 2 + 1) + "'>");
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

    arBoard[iRow][iColumn] = {
      set: true,
      player: (moveCounter % 2 + 1)
    };

    //If this was move number 42, the game is over
    moveCounter++;
    if (moveCounter === 42) {
      console.info("Game is over!");
    }
  }

  function doAITurn(iColumn, iRow) {
    var sPlayerTurn;

    sPlayerTurn = String.fromCharCode(65 + iColumn);
    sPlayerTurn = sPlayerTurn + (iRow + 1).toString();

    fnTurnHandler(sPlayerTurn, function(oTurnSummary) {
      //If the player won the ai doesn't calculate a turn anymore - so we cannot add it and have to check this before
      if (oTurnSummary.isPlayerWinner()) {
        self.celebrate(1);
        gameOver = true;
        return;
      }

      self.addTile(oTurnSummary.getColumnOfAITurn(), true);

      if (oTurnSummary.isRemi()) {
        gameOver = true;
        return;
      }

      if (oTurnSummary.isAIWinner()) {
        self.celebrate(2);
        gameOver = true;
        return;
      }
    });
  }

  this.celebrate = function(iPlayer) {
    $(".player" + iPlayer).addClass("winner");
    $(".tile").not(".winner").addClass("looser");
  }

  this.resetGame = function() {
    fnNewGameHandler(function() {
      $(".tile").each(function(iIndx) {
        var self = $(this);
        var coords = MathUtil.getRandomPlaceOnCircle(TOTAL_WIDTH / 2, TOTAL_HEIGHT / 2, TOTAL_WIDTH);

        self.animate({
          top: coords.y,
          left: coords.x,
          opacity: 0
        }, {
          duration: "slow",
          easing: "swing",
          done: function() {
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
    });
  };
}

function errorFactory(sErrorName, fnMessage) {
  window[sErrorName] = function() {
    this.stack = new Error().stack;
    this.message = fnMessage.apply(fnMessage, arguments);
  };
  window[sErrorName].prototype = Object.create(Error.prototype);
  window[sErrorName].prototype.name = sErrorName;
  window[sErrorName].prototype.constructor = window[sErrorName];
}

errorFactory("ColumnFullError", function() {
  return "The given column (" + arguments[0] + ") is already filled up to the top!";
});

errorFactory("InvalidColumnError", function() {
  return "The given column (" + arguments[0] + ") is invalid!";
});

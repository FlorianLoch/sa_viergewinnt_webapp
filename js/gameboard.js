// gameboard.js
"use strict";

function Gameboard(sContainerId) {
    var self = this,
        arBoard = [],
        oBoard = $(sContainerId),
        moveCounter = 0,
        SLOT_HEIGHT,
        SLOT_WIDTH,
        BUMPER_SIZE,
        oClickSound;
    setUp();
    
    
    function setUp() {
        //Initialize sound
        oClickSound = new buzz.sound("sounds/click", {
            formats: ["ogg", "mp3"],
            preload: true
        });
        
        oBoard.after($("<button>Celebrate</button>").click(function () {
            self.celebrate(1);
        }));
        
        oBoard.append("<div class='bumperVer'>"); 
        for (var i = 0; i < 6; i++) {
            var oRow = $("<div class='row'>");
            oBoard.append(oRow);
            arBoard[i] = [];
            
            oRow.append("<div class='bumperHor'>");
            for (var j = 0; j < 7; j++) {
                var oSlot = $("<div class='slot'>");
                oSlot.click(buildAddHandler(j));
                oRow.append(oSlot);
                oRow.append("<div class='bumperHor'>");    
                                
                arBoard[i][j] = {
                    slot: oSlot,
                    set: false
                };
            }
            
            oBoard.append("<div class='bumperVer'>");   
        }
        
        //Detect sizes set in CSS
        SLOT_HEIGHT = $(".slot").height();
        SLOT_WIDTH = $(".slot").width();
        BUMPER_SIZE = $(".bumperVer").height();
    }
    
    function buildAddHandler(iColumn) {
        return function () {
            console.log("Going to add tile to column " + iColumn);
            self.addTile(iColumn);
        };        
    }
    
    this.addTile = function (iColumn) {
        if (iColumn < 0 || iColumn > 6) throw new InvalidColumnError(iColumn);
        
        //Check whether this column is already full
        if (arBoard[5][iColumn].set === true) throw new ColumnFullError(iColumn);
        
        var oTile = $("<div class='tile player" + (moveCounter % 2 + 1) + "'>");
        oBoard.append(oTile);
        oTile.css({
            top: -SLOT_HEIGHT,
            left: 3 * SLOT_WIDTH + 4 * BUMPER_SIZE,
            opacity: 0.2
        });
        oTile.click(buildAddHandler(iColumn));
        
        //Determine final position of this tile
        var i, iRow;
        for (i = 5; i >= 0 && arBoard[i][iColumn].set === false; i--) {}
        iRow = i + 1;  
        
        var pos = {
            x: (iColumn) * (SLOT_WIDTH + BUMPER_SIZE) + BUMPER_SIZE,
            y: (6 - iRow - 1) * (SLOT_HEIGHT + BUMPER_SIZE) + BUMPER_SIZE
        };
        
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
    
    this.celebrate = function (iPlayer) {
        $(".player" + iPlayer).addClass("winner");
        $(".tile").not(".winner").addClass("looser");
    }
    
    this.resetGame = function () {
        $(".tile").remove();
        for (var i = 0; i < 6; i++) {
            arBoard[i] = [];
            for (var j = 0; j < 7; j++) {
                arBoard[i][j] = {
                    slot: oSlot,
                    set: false
                };
            }
        }
        moveCounter = 0;
    };
}

function ColumnFullError(iColumn) {
    this.message = "The given column (" + iColumn + ") is already filled up to the top!";
    this.stack = new Error().stack;
}
ColumnFullError.prototype.name = "ColumnFullError";
ColumnFullError.prototype = Object.create(Error.prototype);
ColumnFullError.prototype.constructor = ColumnFullError;

function InvalidColumnError(iColumn) {
    this.message = "The given column (" + iColumn + ") is invalid!";
    this.stack = new Error().stack;
}
InvalidColumnError.prototype.name = "InvalidColumnError";
InvalidColumnError.prototype = Object.create(Error.prototype);
InvalidColumnError.prototype.constructor = InvalidColumnError;
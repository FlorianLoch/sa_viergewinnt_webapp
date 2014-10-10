// gameboard.js
"use strict";

function Gameboard(sContainerId) {
    var self = this,
        arBoard = [],
        oBoard = $(sContainerId),
        moveCounter = 0,
        SLOT_HEIGHT,
        SLOT_WIDTH,
        TOTAL_WIDTH,
        TOTAL_HEIGHT,
        BUMPER_SIZE,
        oClickSound,
        arAddHandlers = [];
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
        oBoard.after($("<button>Clean Up</button>").click(function () {
            self.resetGame();
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
        TOTAL_HEIGHT = SLOT_HEIGHT * 6 + BUMPER_SIZE * 7;
        TOTAL_WIDTH = SLOT_WIDTH * 7 + BUMPER_SIZE * 8;
    }
    
    function buildAddHandler(iColumn) {
        if (arAddHandlers[iColumn] === undefined) {
            arAddHandlers[iColumn] = function () {
                self.addTile(iColumn);  
            };
        }
            
        return arAddHandlers[iColumn];    
    }
    
    this.addTile = function (iColumn) {
        if (iColumn < 0 || iColumn > 6) throw new InvalidColumnError(iColumn);
        
        //Check whether this column is already full
        if (arBoard[5][iColumn].set === true) throw new ColumnFullError(iColumn);
        
        var oTile = $("<div class='tile player" + (moveCounter % 2 + 1) + "'>");
        oBoard.append(oTile);
        oTile.css({
            top: -SLOT_HEIGHT,
            left: (iColumn) * (SLOT_WIDTH + BUMPER_SIZE) + BUMPER_SIZE,
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
        $(".tile").each(function (iIndx) {
            var self = $(this);
            var coords = MathUtil.getRandomPlaceOnCircle(TOTAL_WIDTH / 2, TOTAL_HEIGHT / 2, TOTAL_WIDTH);
            
            console.log(coords);
            
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
function markOpponentMove(fromID, destID, board) {
    board.addColorLayer(fromID, "opponent_moved_tile");
    board.addColorLayer(destID, "opponent_moved_tile");
}

class RandomMoveAI {
    constructor(board) {
        this.board = board;
        this.resigned = false;
    }
    
    resign() {
        window.alert("Opponent has no legal moves! You win!");
        this.board.resetData();
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let currentID = toID([i, j]);
                initializeBoardColors(this.board, i, j, currentID);
            }
        }
        this.board.render();
        this.resigned = true;
    }
    
    chooseRandomElement(arr, err) {
        if (arr.length !== 0) {
            return arr[Math.floor(arr.length * Math.random())];
        }
        err();
    }
    
    chooseMove() {
        let choices = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                // TODO: right now this is only moving the knights
                if (piece === BLACK_KNIGHT) {
                    choices.push([piece, i, j]);
                }
            }
        }
        let chosen = this.chooseRandomElement(choices, this.resign.bind(this));
        if (!this.resigned)
        {
            let destinationIDs = getMoves(chosen[0], chosen[1], chosen[2], BLACK, this.board.grid);
            let destID = this.chooseRandomElement(destinationIDs, this.resign.bind(this));
            if (!this.resigned) {
                let fromID = toID(chosen.slice(1));
                
                this.board.selectedPieceID = fromID;
                this.board.makeMove(destID);
                markOpponentMove(fromID, destID, this.board);
            }
        }
    }
}
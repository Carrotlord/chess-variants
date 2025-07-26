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
    }

    chooseRandomIndex(arr) {
        if (arr.length === 0) {
            return -1;
        }
        return Math.floor(arr.length * Math.random());
    }

    removeRandomElement(arr) {
        let index = this.chooseRandomIndex(arr);
        if (index === -1) {
            // The array is empty so we can't remove anything
            return null;
        }
        let val = arr[index]; // save the value
        arr.splice(index, 1); // delete the element
        return val;
    }

    chooseRandomElement(arr) {
        let index = this.chooseRandomIndex(arr);
        if (index === -1) {
            // The array is empty so we can't choose anything
            return null;
        }
        return arr[index];
    }

    getPartialLegalMoves(choices) {
        while (choices.length > 0) {
            let chosen = this.removeRandomElement(choices);
            let destinationIDs = getMoves(chosen[0], chosen[1], chosen[2], BLACK, this.board.grid);
            if (destinationIDs.length > 0) {
                // We found a piece that can be moved
                return [chosen, destinationIDs];
            }
        }
        // There are no legal moves!
        this.resign();
        return null;
    }

    chooseMove() {
        let choices = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                // TODO: right now this can only move knights, pawns, and the king
                if (piece === BLACK_KNIGHT || piece === BLACK_PAWN || piece == BLACK_KING) {
                    choices.push([piece, i, j]);
                }
            }
        }
        let partialMoves = this.getPartialLegalMoves(choices);
        if (partialMoves === null) {
            return;
        }
        let [chosen, destinationIDs] = partialMoves;
        let destID = this.chooseRandomElement(destinationIDs);
        let fromID = toID(chosen.slice(1));

        this.board.selectedPieceID = fromID;
        this.board.makeMove(destID);
        markOpponentMove(fromID, destID, this.board);
    }
}
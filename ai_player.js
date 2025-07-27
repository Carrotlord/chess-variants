function markOpponentMove(fromID, destID, board) {
    board.addColorLayer(fromID, "opponent_moved_tile");
    board.addColorLayer(destID, "opponent_moved_tile");
}

class RandomMoveAI {
    constructor(board) {
        this.board = board;
    }

    stalemate() {
        window.alert("Opponent has no legal moves, but is not in check. Stalemate!");
        this.gameOver();
    }

    resign() {
        window.alert("Opponent has lost to checkmate. You win!");
        this.gameOver();
    }

    gameOver() {
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
            let chosenID = toID(chosen.slice(1));
            let destinationIDs = getMoves(chosen[0], chosen[1], chosen[2], BLACK, this.board.grid).filter((move) =>
                !isKingInCheckAfterMove(this.board, chosenID, move, BLACK));
            if (destinationIDs.length > 0) {
                // We found a piece that can be moved
                return [chosen, destinationIDs];
            }
        }
        // There are no legal moves!
        if (detectKingInCheck(this.board, BLACK) === null) {
            this.stalemate();  // We're not in check, but can't move anywhere
        } else {
            this.resign();     // It's checkmate
        }
        return null;
    }

    chooseMove() {
        let choices = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                if (piece & BLACK) {
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

        this.board.makeMove(fromID, destID);
        markOpponentMove(fromID, destID, this.board);
    }
}
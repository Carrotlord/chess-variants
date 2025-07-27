function markOpponentMove(fromID, destID, board) {
    board.addColorLayer(fromID, "opponent_moved_tile");
    board.addColorLayer(destID, "opponent_moved_tile");
}

class AbstractAI {
    constructor(board) {
        this.board = board;
    }

    stalemate() {
        this.board.render();
        setTimeout(() => {
            window.alert("Opponent has no legal moves, but is not in check. Stalemate!");
            this.gameOver();
        }, 1);
    }

    resign() {
        this.board.render();
        setTimeout(() => {
            window.alert("Opponent has lost to checkmate. You win!");
            this.gameOver();
        }, 1);
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

    noLegalMoves() {
        if (detectKingInCheck(this.board, BLACK) === null) {
            this.stalemate();  // We're not in check, but can't move anywhere
        } else {
            this.resign();     // It's checkmate
        }
    }
}

class RandomMoveAI extends AbstractAI {
    constructor(board) {
        super(board);
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
        this.noLegalMoves();
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

/** The novice AI uses simple heuristics to pick a move without attempting
 *  to traverse the game tree.
 */
class NoviceAI extends AbstractAI {
    constructor(board) {
        super(board);
        this.pieceValues = {
            [KING]: 99999, [QUEEN]: 9, [ROOK]: 5,
            [BISHOP]: 3, [KNIGHT]: 3, [PAWN]: 1,
            [EMPTY]: 0
        };
    }

    evaluatePiece(piece) {
        let val = this.pieceValues[piece & KIND];
        return piece & WHITE ? -val : val;
    }

    evaluateBoard() {
        let sum = 0;
        for (let row of this.board.grid) {
            for (let piece of row) {
                sum += this.evaluatePiece(piece);
            }
        }
        return sum;
    }

    evaluateMove(origin, destination) {
        let val = 0;
        this.board.makeMove(origin, destination);
        if (isCheckmate(this.board, WHITE)) {
            val = 999999; // found mate in 1
        } else {
            val = this.evaluateBoard();
        }
        this.board.undoMove();
        return val;
    }

    chooseMove() {
        let maxVal = -9999999;
        let bestMoves = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                if (piece & BLACK) {
                    let chosenID = toID([i, j]);
                    let moves = getMoves(piece, i, j, BLACK, this.board.grid).filter((move) =>
                        !isKingInCheckAfterMove(this.board, chosenID, move, BLACK));
                    for (let move of moves) {
                        let currentVal = this.evaluateMove(chosenID, move);
                        if (currentVal > maxVal) {
                            maxVal = currentVal;
                            bestMoves = [[chosenID, move]];
                        } else if (currentVal === maxVal) {
                            bestMoves.push([chosenID, move]);
                        }
                    }
                }
            }
        }
        if (bestMoves.length > 0) {
            let [fromID, destID] = this.chooseRandomElement(bestMoves);
            this.board.makeMove(fromID, destID);
            markOpponentMove(fromID, destID, this.board);
        } else {
            this.noLegalMoves();
        }
    }
}
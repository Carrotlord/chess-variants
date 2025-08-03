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

class TranspositionTable {
    constructor() {
        this.table = {};
        this.cacheHit = 0;
        this.cacheMiss = 0;
        this.LOWER = 0;
        this.UPPER = 1;
        this.OK = 2;
    }

    boardToString(board) {
        let arrays = board.grid.map(row => row.map(piece => String.fromCharCode(CHAR_CODE_a + piece)));
        return arrays.map(rowArray => rowArray.join("")).join("");
    }

    cache(board, evaluation, originalMove, depth) {
        let result = {val: evaluation, move: originalMove, depth: depth};
        this.table[this.boardToString(board)] = result;
        return result;
    }

    cacheAlpha(board, evaluation, originalMove, depth, alpha, beta) {
        let kind = this.OK;
        if (evaluation <= alpha) {
            kind = this.UPPER;
        } else if (evaluation >= beta) {
            kind = this.LOWER;
        }
        let result = {val: evaluation, move: originalMove, depth: depth, kind: kind};
        this.table[this.boardToString(board)] = result;
        return result;
    }

    get(board, currentDepth) {
        let key = this.boardToString(board);
        if (this.table.hasOwnProperty(key)) {
            let result = this.table[key];
            if (result.depth >= currentDepth) {
                this.cacheHit++;
                return result;
            }
        }
        this.cacheMiss++;
        return null;
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

/** Searches the game tree with a certain default depth */
class IntermediateAI extends AbstractAI {
    constructor(board) {
        super(board);
        this.pieceValues = {
            [KING]: 99999, [QUEEN]: 9, [ROOK]: 5,
            [BISHOP]: 3, [KNIGHT]: 3, [PAWN]: 1,
            [EMPTY]: 0
        };
        this.table = new TranspositionTable();
        this.defaultSearchDepth = 4;
    }

    evaluatePiece(piece, color) {
        let val = this.pieceValues[piece & KIND];
        // If the color matches, it's beneficial
        return piece & color ? val : -val;
    }

    evaluateBoard(aiColor, depth) {
        if (isCheckmate(this.board, aiColor === WHITE ? BLACK : WHITE)) {
            // Found checkmate, adjust depth for mate in N
            return 999999 - this.defaultSearchDepth + depth;
        } else if (isCheckmate(this.board, aiColor)) {
            // We're about to lose, adjust depth to avoid mate in N
            return -999999 + this.defaultSearchDepth - depth;
        }
        let sum = 0;
        for (let row of this.board.grid) {
            for (let piece of row) {
                sum += this.evaluatePiece(piece, aiColor);
            }
        }
        return sum;
    }

    /* Search algorithm is negamax with no alpha-beta pruning */
    negamax(depth, color, originalMove) {
        if (depth <= 0) {
            // The search is done
            return {val: this.evaluateBoard(color, depth), move: originalMove, depth: depth};
        }
        let cached = this.table.get(this.board, depth);
        if (cached !== null) {
            return cached;
        }
        let bestValue = -9999999;
        let bestMoves = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                if (piece & color) {
                    let chosenID = toID([i, j]);
                    let moves = getMoves(piece, i, j, color, this.board.grid).filter((move) =>
                        !isKingInCheckAfterMove(this.board, chosenID, move, color));
                    for (let move of moves) {
                        this.board.makeMove(chosenID, move);
                        let result = this.negamax(depth - 1, color === WHITE ? BLACK : WHITE, move);
                        this.board.undoMove();
                        let currentValue = -result.val;
                        if (currentValue > bestValue) {
                            bestValue = currentValue;
                            bestMoves = [[chosenID, move]];
                        } else if (currentValue === bestValue) {
                            bestMoves.push([chosenID, move]);
                        }
                    }
                }
            }
        }
        if (bestMoves.length === 0) {
            // We don't have any moves
            if (isStalemate(this.board, color)) {
                if (this.evaluateBoard(color, depth) < 0) {
                    // If we have less material and we find a stalemate,
                    // we're happy to accept a draw as the outcome
                    return this.table.cache(this.board, 999999 - this.defaultSearchDepth + depth, originalMove, depth);
                } else {
                    // Otherwise avoid the stalemate
                    return this.table.cache(this.board, -999999 + this.defaultSearchDepth - depth, originalMove, depth);
                }
            } else {
                // When we evaluate the board, checkmate is already considered
                return this.table.cache(this.board, this.evaluateBoard(color, depth), originalMove, depth);
            }
        }
        let bestMove = this.chooseRandomElement(bestMoves);
        return this.table.cache(this.board, bestValue, bestMove, depth);
    }

    chooseMove() {
        let result = this.negamax(this.defaultSearchDepth, BLACK, null);
        if (result.move !== null) {
            let [fromID, destID] = result.move;
            this.board.makeMove(fromID, destID);
            markOpponentMove(fromID, destID, this.board);
        } else {
            this.noLegalMoves();
        }
    }
}

class AdvancedAI extends AbstractAI {
    constructor(board) {
        super(board);
        this.pieceValues = {
            [KING]: 99999, [QUEEN]: 9, [ROOK]: 5,
            [BISHOP]: 3, [KNIGHT]: 3, [PAWN]: 1,
            [EMPTY]: 0
        };
        this.table = new TranspositionTable();
        this.defaultSearchDepth = 6;
    }

    evaluatePiece(piece, color) {
        let val = this.pieceValues[piece & KIND];
        // If the color matches, it's beneficial
        return piece & color ? val : -val;
    }

    evaluateBoard(aiColor, depth) {
        if (isCheckmate(this.board, aiColor === WHITE ? BLACK : WHITE)) {
            // Found checkmate, adjust depth for mate in N
            return 999999 - this.defaultSearchDepth + depth;
        } else if (isCheckmate(this.board, aiColor)) {
            // We're about to lose, adjust depth to avoid mate in N
            return -999999 + this.defaultSearchDepth - depth;
        }
        let sum = 0;
        for (let row of this.board.grid) {
            for (let piece of row) {
                sum += this.evaluatePiece(piece, aiColor);
            }
        }
        return sum;
    }

    /* Search algorithm is negamax with alpha-beta pruning and move ordering */
    alphaBetaNegamax(depth, color, originalMove, alpha, beta) {
        if (depth <= 0) {
            // The search is done
            return {val: this.evaluateBoard(color, depth), move: originalMove, kind: this.table.OK};
        }
        let cached = this.table.get(this.board, depth);
        if (cached !== null) {
            if (cached.kind === this.table.LOWER) {
                alpha = Math.max(cached.val, alpha);
            } else if (cached.kind === this.table.UPPER) {
                beta = Math.min(cached.val, beta);
            }
            if (cached.kind === this.table.OK || alpha >= beta) {
                return cached;
            }
        }
        let bestValue = -9999999;
        let otherColor = color === WHITE ? BLACK : WHITE;
        let bestMoves = [];
        let mateInOne = [];
        let queenCaptures = [];
        let rookCaptures = [];
        let knightOrBishopCaptures = [];
        let pawnCaptures = [];
        let checks = [];
        let others = [];
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                let piece = this.board.grid[i][j];
                if (piece & color) {
                    let chosenID = toID([i, j]);
                    let moves = getMoves(piece, i, j, color, this.board.grid).filter((move) =>
                        !isKingInCheckAfterMove(this.board, chosenID, move, color));
                    for (let move of moves) {
                        let [iPrime, jPrime] = toCoords(move);
                        let capturedKind = this.board.grid[iPrime][jPrime] & KIND;
                        let fullMove = [chosenID, move];
                        if (isCheckmateAfterMove(this.board, chosenID, move, otherColor)) {
                            mateInOne.push(fullMove);
                            continue;
                        }
                        // We don't check the color of the captured
                        // piece because it's not possible to move onto
                        // one of your own pieces
                        switch (capturedKind) {
                            case QUEEN:
                                queenCaptures.push(fullMove);
                                break;
                            case ROOK:
                                rookCaptures.push(fullMove);
                                break;
                            case KNIGHT:
                            case BISHOP:
                                knightOrBishopCaptures.push(fullMove);
                                break;
                            case PAWN:
                                pawnCaptures.push(fullMove);
                                break;
                            default:
                                // If the other king is in check
                                if (isKingInCheckAfterMove(this.board, chosenID, move, otherColor)) {
                                    checks.push(fullMove);
                                } else {
                                    others.push(fullMove);
                                }
                                break;
                        }
                    }
                }
            }
        }
        let orderedMoves = mateInOne.concat(queenCaptures, rookCaptures, knightOrBishopCaptures, pawnCaptures, checks, others);
        for (let fullMove of orderedMoves) {
            let [chosenID, move] = fullMove;
            this.board.makeMove(chosenID, move);
            let result = this.alphaBetaNegamax(depth - 1, otherColor, move, -beta, -alpha);
            this.board.undoMove();
            let currentValue = -result.val;
            if (currentValue > bestValue) {
                bestValue = currentValue;
                bestMoves = [[chosenID, move]];
            } else if (currentValue === bestValue) {
                bestMoves.push([chosenID, move]);
            }
            if (bestValue > alpha) {
                alpha = bestValue;
            }
            if (alpha >= beta) {
                break;
            }
        }
        if (bestMoves.length === 0) {
            // We don't have any moves
            if (isStalemate(this.board, color)) {
                if (this.evaluateBoard(color, depth) < 0) {
                    // If we have less material and we find a stalemate,
                    // we're happy to accept a draw as the outcome
                    return this.table.cacheAlpha(this.board, 999999 - this.defaultSearchDepth + depth,
                                                 originalMove, depth, alpha, beta);
                } else {
                    // Otherwise avoid the stalemate
                    return this.table.cacheAlpha(this.board, -999999 + this.defaultSearchDepth - depth,
                                                 originalMove, depth, alpha, beta);
                }
            } else {
                // When we evaluate the board, checkmate is already considered
                return this.table.cacheAlpha(this.board, this.evaluateBoard(color, depth),
                                             originalMove, depth, alpha, beta);
            }
        }
        let bestMove = this.chooseRandomElement(bestMoves);
        return this.table.cacheAlpha(this.board, bestValue, bestMove, depth, alpha, beta);
    }

    chooseMove() {
        let result = this.alphaBetaNegamax(this.defaultSearchDepth, BLACK, null, -9999999, 9999999);
        if (result.move !== null) {
            let [fromID, destID] = result.move;
            this.board.makeMove(fromID, destID);
            markOpponentMove(fromID, destID, this.board);
        } else {
            this.noLegalMoves();
        }
    }
}

function maybeGetPiece(i, j, grid) {
    return outOfBounds(i, j) ? EMPTY : grid[i][j];
}

/** Check if the piece at [i, j] is in danger from an opponent's piece.
 *  If so, return the coordinates of the other piece that is causing the danger.
 *  Returns null if there is no such danger.
 */
function detectPieceInDanger(i, j, grid) {
    let piece = grid[i][j];
    let color = piece & COLOR;
    // Check for pawn dangers
    if (color === BLACK) {
        let leftPawn = maybeGetPiece(i + 1, j - 1, grid);
        if (leftPawn === WHITE_PAWN) {
            return [i + 1, j - 1];
        }
        let rightPawn = maybeGetPiece(i + 1, j + 1, grid);
        if (rightPawn === WHITE_PAWN) {
            return [i + 1, j + 1];
        }
    } else {
        let leftPawn = maybeGetPiece(i - 1, j - 1, grid);
        if (leftPawn === BLACK_PAWN) {
            return [i - 1, j - 1];
        }
        let rightPawn = maybeGetPiece(i - 1, j + 1, grid);
        if (rightPawn === BLACK_PAWN) {
            return [i - 1, j + 1];
        }
    }
    // Check for knight dangers
    let possibleKnights = filterMoveOntoOwnColor(COMPUTED_KNIGHT_MOVES[toID2(i, j)], color, grid);
    for (let knightCoord of possibleKnights) {
        let [iPrime, jPrime] = knightCoord;
        let knight = grid[iPrime][jPrime];
        if (color === BLACK && knight === WHITE_KNIGHT) {
            return knightCoord;
        }
        if (color === WHITE && knight === BLACK_KNIGHT) {
            return knightCoord;
        }
    }
    // Check for diagonal dangers
    let possibleDiagonals = getBishopMoves(i, j, grid);
    for (let diagonal of possibleDiagonals) {
        let [iPrime, jPrime] = diagonal;
        let diagonalPiece = grid[iPrime][jPrime];
        let diagonalKind = diagonalPiece & KIND;
        if (diagonalKind === BISHOP || diagonalKind === QUEEN) {
            if (color !== (diagonalPiece & COLOR)) {
                // If the colors don't match, it's a danger
                // from an opponent's bishop or queen
                return diagonal;
            }
        }
    }
    // Check for horizontal dangers
    let possibleHorizontals = getRookMoves(i, j, grid);
    for (let horizontal of possibleHorizontals) {
        let [iPrime, jPrime] = horizontal;
        let horizontalPiece = grid[iPrime][jPrime];
        let horizontalKind = horizontalPiece & KIND;
        if (horizontalKind === ROOK || horizontalKind === QUEEN) {
            if (color !== (horizontalPiece & COLOR)) {
                // If the colors don't match, it's a danger
                // from an opponent's rook or queen
                return horizontal;
            }
        }
    }
    // Check for king dangers.
    // It's unlikely that the opponent's king is adjacent to this piece,
    // so check this part last.
    let possibleKings = filterMoveOntoOwnColor(COMPUTED_KING_MOVES[toID2(i, j)], color, grid);
    for (let kingCoord of possibleKings) {
        let [iPrime, jPrime] = kingCoord;
        let king = grid[iPrime][jPrime];
        if (color === BLACK && king === WHITE_KING) {
            return kingCoord;
        }
        if (color === WHITE && king === BLACK_KING) {
            return kingCoord;
        }
    }
    return null; // this piece is not in danger of being captured
}

function generatePieceUnicodeChars() {
    let result = {};
    for (let [key, val] of Object.entries(PIECE_SYMBOLS)) {
        if (val.length === 0) {
            result[key] = "NONE";
        } else {
            let span = document.createElement("span");
            span.innerHTML = val;
            result[key] = span.textContent;
        }
    }
    return result;
}
const PIECE_UNICODE_CHARS = generatePieceUnicodeChars();

function reportSquare(i, j, grid) {
    return `${PIECE_UNICODE_CHARS[grid[i][j]]} on ${toAlgebraic([i, j])}`;
}

function detectKingInCheck(board, kingColor) {
    let i, j;
    if (kingColor === BLACK) {
        [i, j] = toCoords(board.cachedBlackKingPositionID);
    } else {
        [i, j] = toCoords(board.cachedWhiteKingPositionID);
    }
    return detectPieceInDanger(i, j, board.grid);
}

function isKingInCheckAfterMove(board, origin, destination, kingColor) {
    board.makeMove(origin, destination);
    let checkingCoords = detectKingInCheck(board, kingColor);
    board.undoMove();
    return checkingCoords !== null;
}

function hasNoLegalMoves(board, color) {
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            let piece = board.grid[i][j];
            let origin = toID2(i, j);
            if (piece & color) {
                let moves = getMoves(piece, i, j, color, board.grid);
                for (let move of moves) {
                    if (!isKingInCheckAfterMove(board, origin, move, color)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function isStalemate(board, color) {
    return detectKingInCheck(board, color) === null && hasNoLegalMoves(board, color);
}

function isCheckmate(board, color) {
    return detectKingInCheck(board, color) !== null && hasNoLegalMoves(board, color);
}

function isCheckmateAfterMove(board, origin, destination, kingColor) {
    board.makeMove(origin, destination);
    let answer = isCheckmate(board, kingColor);
    board.undoMove();
    return answer;
}

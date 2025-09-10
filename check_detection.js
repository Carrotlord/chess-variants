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
    // If our vision of anything that could put the king
    // in check has not changed, return the cached result

    // TODO: there appears to be an issue with the cache
    // due to the addition of castling, so for now,
    // some parts of this method are commented out
    if (kingColor === BLACK) {
        /*if (board.checkingPieceForBlackIsValid) {
            board.diagnostics.blackCacheHit++;
            return board.blackKingCheckingPieceCoords;
        }*/
        let [i, j] = toCoords(board.cachedBlackKingPositionID);
        board.blackKingCheckingPieceCoords = detectPieceInDanger(i, j, board.grid);
        board.checkingPieceForBlackIsValid = true;
        board.diagnostics.blackCacheMiss++;
        return board.blackKingCheckingPieceCoords;
    } else {
        /*if (board.checkingPieceForWhiteIsValid) {
            board.diagnostics.whiteCacheHit++;
            return board.whiteKingCheckingPieceCoords;
        }*/
        let [i, j] = toCoords(board.cachedWhiteKingPositionID);
        board.whiteKingCheckingPieceCoords = detectPieceInDanger(i, j, board.grid);
        board.checkingPieceForWhiteIsValid = true;
        board.diagnostics.whiteCacheMiss++;
        return board.whiteKingCheckingPieceCoords;
    }
}

function isKingInCheckAfterMove(board, origin, destination, kingColor) {
    board.makeMove(origin, destination);
    let checkingCoords = detectKingInCheck(board, kingColor);
    board.undoMove();
    return checkingCoords !== null;
}

function loadAllMoveDestinations(color, board, iPrime, jPrime) {
    let destinations = [];
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            if (i === iPrime && j === jPrime) {
                // We already processed king moves
                continue;
            }
            let piece = board.grid[i][j];
            if (piece & color) {
                destinations.push(...loadMoves(piece, i, j, color, board));
            }
        }
    }
    return destinations;
}

function lineBetweenSquares(i, j, k, m) {
    if (i < k && j < m) {
        // Move diagonally
        let squares = [];
        while (i <= k) {
            squares.push(toID2(k, m));
            k--;
            m--;
        }
        return squares;
    } else if (i < k && m < j) {
        let squares = [];
        while (i <= k) {
            squares.push(toID2(k, m));
            k--;
            m++;
        }
        return squares;
    } else if (i === k) {
        // Draw a horizontal line
        let startID = toID2(i, Math.min(j, m));
        return Array.from({length: 1 + Math.abs(j - m)}, (_, index) => startID + index);
    } else if (j === m) {
        // Draw a vertical line (set a square once every 8 squares)
        let startID = toID2(Math.min(i, k), j);
        return Array.from({length: 1 + Math.abs(i - k)}, (_, index) => startID + (index << 3));
    }
    // Swap endpoints and try again
    return lineBetweenSquares(k, m, i, j);
}

function getLineKey(i, j, k, m) {
    return i | (j << 3) || (k << 6) || (m << 9);
}

function computeAllLines() {
    let allLines = new Array(4096);
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            for (let k = 0; k < BOARD_HEIGHT; k++) {
                for (let m = 0; m < BOARD_WIDTH; m++) {
                    allLines[getLineKey(i, j, k, m)] = new Set(lineBetweenSquares(i, j, k, m));
                }
            }
        }
    }
    return allLines;
}
let ALL_LINES = computeAllLines();

function hasNoLegalMoves(board, color, checkingPieceCoords = null) {
    let kingOrigin = color === WHITE ?
                     board.cachedWhiteKingPositionID : board.cachedBlackKingPositionID;
    let [iPrime, jPrime] = toCoords(kingOrigin);
    let kingMoves = loadMoves(color === WHITE ? WHITE_KING : BLACK_KING, iPrime, jPrime, color, board);
    // Move the king first, to see if we can get out of check
    for (let kingMove of kingMoves) {
        if (!isKingInCheckAfterMove(board, kingOrigin, kingMove, color)) {
            return false;
        }
    }
    if (checkingPieceCoords !== null) {
        // If we know which piece is causing check
        let [k, m] = checkingPieceCoords;
        let checkingPiece = board.grid[k][m];
        let kind = checkingPiece & KIND;
        let moveTargets = loadAllMoveDestinations(color, board, iPrime, jPrime);
        if (kind === KNIGHT || kind === PAWN) {
            // Knights and pawns can't be blocked,
            // only captured in order to stop the Check
            if (moveTargets.includes(toID2(k, m))) {
                return false; // it is possible to capture the knight or pawn
            }
        } else {
            // It must be a rook, bishop, or queen.
            // Draw a line between the king and the checking piece:
            let squareSet = ALL_LINES[getLineKey(iPrime, jPrime, k, m)];
            for (let target of moveTargets) {
                if (target !== kingOrigin && squareSet.has(target)) {
                    // We can block the check or capture the piece
                    return false;
                }
            }
        }
        // If we get to this point, we couldn't prevent the check.
        // The other possibility is that there are 2 or more pieces
        // causing check. In this case, no blocking or capture
        // can remove the check from both pieces.
        // Since we already moved the king and know that there are
        // no safe squares, there's no way to escape check:
        return true;
    }
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            if (i === iPrime && j === jPrime) {
                // We already processed king moves
                continue;
            }
            let piece = board.grid[i][j];
            let origin = toID2(i, j);
            if (piece & color) {
                let moves = loadMoves(piece, i, j, color, board);
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
    let checkingPieceCoords = detectKingInCheck(board, color);
    if (checkingPieceCoords === null) {
        return false;
    }
    return hasNoLegalMoves(board, color, checkingPieceCoords);
}

function isCheckmateAfterMove(board, origin, destination, kingColor) {
    board.makeMove(origin, destination);
    let answer = isCheckmate(board, kingColor);
    board.undoMove();
    return answer;
}

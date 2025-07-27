const DIAGONAL_PIECE = BISHOP | QUEEN;
const HORIZONTAL_PIECE = ROOK | QUEEN;

function maybeGetPiece(i, j, grid) {
    return outOfBounds(i, j) ? EMPTY : grid[i][j];
}

function isPieceInDanger(i, j, grid) {
    let piece = grid[i][j];
    let color = piece & COLOR;
    // Check for pawn dangers
    if (color === BLACK) {
        let leftPawn = maybeGetPiece(i + 1, j - 1, grid);
        if (leftPawn === WHITE_PAWN) {
            return true;
        }
        let rightPawn = maybeGetPiece(i + 1, j + 1, grid);
        if (rightPawn === WHITE_PAWN) {
            return true;
        }
    } else {
        let leftPawn = maybeGetPiece(i - 1, j - 1, grid);
        if (leftPawn === BLACK_PAWN) {
            return true;
        }
        let rightPawn = maybeGetPiece(i - 1, j + 1, grid);
        if (rightPawn === BLACK_PAWN) {
            return true;
        }
    }
    // Check for knight dangers
    let possibleKnights = filterLegalMoves(getKnightMoves(i, j), color, grid);
    for (let knightCoord of possibleKnights) {
        let [iPrime, jPrime] = knightCoord;
        let knight = grid[iPrime][jPrime];
        if (color === BLACK && knight === WHITE_KNIGHT) {
            return true;
        }
        if (color === WHITE && knight === BLACK_KNIGHT) {
            return true;
        }
    }
    // Check for diagonal dangers
    let possibleDiagonals = getBishopMoves(i, j, grid);
    for (let diagonal of possibleDiagonals) {
        let [iPrime, jPrime] = diagonal;
        let diagonalPiece = grid[iPrime][jPrime];
        if (diagonalPiece & DIAGONAL_PIECE) {
            if (color !== (diagonalPiece & COLOR)) {
                // If the colors don't match, it's a danger
                // from an opponent's bishop or queen
                return true;
            }
        }
    }
    // Check for horizontal dangers
    let possibleHorizontals = getRookMoves(i, j, grid);
    for (let horizontal of possibleHorizontals) {
        let [iPrime, jPrime] = horizontal;
        let horizontalPiece = grid[iPrime][jPrime];
        if (horizontalPiece & HORIZONTAL_PIECE) {
            if (color !== (horizontalPiece & COLOR)) {
                // If the colors don't match, it's a danger
                // from an opponent's rook or queen
                return true;
            }
        }
    }
    // Check for king dangers.
    // It's unlikely that the opponent's king is adjacent to this piece,
    // so check this part last.
    let possibleKings = filterLegalMoves(getKingMoves(i, j), color, grid);
    for (let kingCoord of possibleKings) {
        let [iPrime, jPrime] = kingCoord;
        let king = grid[iPrime][jPrime];
        if (color === BLACK && king === WHITE_KING) {
            return true;
        }
        if (color === WHITE && king === BLACK_KING) {
            return true;
        }
    }
    return false; // this piece is not in danger of being captured
}

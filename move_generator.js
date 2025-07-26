function outOfBounds(i, j) {
    return i < 0 || j < 0 || i >= BOARD_HEIGHT || j >= BOARD_WIDTH;
}

function filterLegalMoves(moves, movingColor, grid) {
    return moves.filter((move) => {
        let [i, j] = move;
        if (outOfBounds(i, j) || (grid[i][j] & COLOR) === movingColor) {
            // Can't be outside the board or capturing a friendly piece
            return false;
        }
        /* TODO: conditions for king in check */
        return true;
    });
}

function getKnightMoves(i, j) {
    return [[i - 2, j - 1], [i - 1, j - 2], [i + 1, j - 2], [i + 2, j - 1],
            [i + 2, j + 1], [i + 1, j + 2], [i - 1, j + 2], [i - 2, j + 1]];
}

function getKingMoves(i, j, abbreviated) {
    return [[i - 1, j - 1], [i - 1, j + 1], [i + 1, j - 1], [i + 1, j + 1],
            [i, j + 1], [i + 1, j], [i, j - 1], [i - 1, j]];
}

function getPawnMoves(i, j, grid) {
    let pawn = grid[i][j];
    let moves = [];
    if (pawn & BLACK) {
        if (grid[i + 1][j] === EMPTY) {
            moves.push([i + 1, j]);
            if (i === 1 && grid[3][j] === EMPTY) {
                // Moving 2 squares is allowed for the home row of pawns,
                // but there can't be pieces in the way.
                moves.push([3, j]);
            }
        }
        // Capture opponent's pieces with a pawn
        if (grid[i + 1][j - 1] & WHITE) {
            moves.push([i + 1, j - 1]);
        }
        if (grid[i + 1][j + 1] & WHITE) {
            moves.push([i + 1, j + 1]);
        }
    } else {
        if (grid[i - 1][j] === EMPTY) {
            moves.push([i - 1, j]);
            if (i === 6 && grid[4][j] === EMPTY) {
                // Moving 2 squares is allowed for the home row of pawns,
                // but there can't be pieces in the way.
                moves.push([4, j]);
            }
        }
        // Capture opponent's pieces with a pawn
        if (grid[i - 1][j - 1] & BLACK) {
            moves.push([i - 1, j - 1]);
        }
        if (grid[i - 1][j + 1] & BLACK) {
            moves.push([i - 1, j + 1]);
        }
    }
    return moves;
}

function getBishopMoves(i, j, grid) {
    let bishopColor = grid[i][j] & COLOR;
    let collectedCoords = [];
    let iPrime;
    let jPrime;
    /* Move northwest until we hit an obstacle. */
    for (iPrime = i - 1, jPrime = j - 1;
         iPrime >= 0 && jPrime >= 0 && grid[iPrime][jPrime] === EMPTY;
         --iPrime, --jPrime) {
        collectedCoords.push([iPrime, jPrime]);
    }
    if (iPrime >= 0 && jPrime >= 0 && (grid[iPrime][jPrime] & COLOR) !== bishopColor) {
        collectedCoords.push([iPrime, jPrime]);
    }
    /* Move southwest until we hit an obstacle. */
    for (iPrime = i + 1, jPrime = j - 1;
         iPrime < BOARD_HEIGHT && jPrime >= 0 && grid[iPrime][jPrime] === EMPTY;
         ++iPrime, --jPrime) {
        collectedCoords.push([iPrime, jPrime]);
    }
    if (iPrime < BOARD_HEIGHT && jPrime >= 0 && (grid[iPrime][jPrime] & COLOR) !== bishopColor) {
        collectedCoords.push([iPrime, jPrime]);
    }
    /* Move northeast until we hit an obstacle. */
    for (iPrime = i - 1, jPrime = j + 1;
         iPrime >= 0 && jPrime < BOARD_WIDTH && grid[iPrime][jPrime] === EMPTY;
         --iPrime, ++jPrime) {
        collectedCoords.push([iPrime, jPrime]);
    }
    if (iPrime >= 0 && jPrime < BOARD_WIDTH && (grid[iPrime][jPrime] & COLOR) !== bishopColor) {
        collectedCoords.push([iPrime, jPrime]);
    }
    /* Move southeast until we hit an obstacle. */
    for (iPrime = i + 1, jPrime = j + 1;
         iPrime < BOARD_HEIGHT && jPrime < BOARD_WIDTH && grid[iPrime][jPrime] === EMPTY;
         ++iPrime, ++jPrime) {
        collectedCoords.push([iPrime, jPrime]);
    }
    if (iPrime < BOARD_HEIGHT && jPrime < BOARD_WIDTH && (grid[iPrime][jPrime] & COLOR) !== bishopColor) {
        collectedCoords.push([iPrime, jPrime]);
    }
    return collectedCoords;
}

function getRookMoves(i, j, grid) {
    let rookColor = grid[i][j] & COLOR;
    let collectedCoords = [];
    let iPrime;
    let jPrime;
    /* Move north until we hit an obstacle. */
    for (iPrime = i - 1; iPrime >= 0 && grid[iPrime][j] === EMPTY; --iPrime) {
        collectedCoords.push([iPrime, j]);
    }
    if (iPrime >= 0 && (grid[iPrime][j] & COLOR) !== rookColor) {
        collectedCoords.push([iPrime, j]);
    }
    /* Move south until we hit an obstacle. */
    for (iPrime = i + 1; iPrime < BOARD_HEIGHT && grid[iPrime][j] === EMPTY; ++iPrime) {
        collectedCoords.push([iPrime, j]);
    }
    if (iPrime < BOARD_HEIGHT && (grid[iPrime][j] & COLOR) !== rookColor) {
        collectedCoords.push([iPrime, j]);
    }
    /* Move west until we hit an obstacle. */
    for (jPrime = j - 1; jPrime >= 0 && grid[i][jPrime] === EMPTY; --jPrime) {
        collectedCoords.push([i, jPrime]);
    }
    if (jPrime >= 0 && (grid[i][jPrime] & COLOR) !== rookColor) {
        collectedCoords.push([i, jPrime]);
    }
    /* Move east until we hit an obstacle. */
    for (jPrime = j + 1; jPrime < BOARD_WIDTH && grid[i][jPrime] === EMPTY; ++jPrime) {
        collectedCoords.push([i, jPrime]);
    }
    if (jPrime < BOARD_WIDTH && (grid[i][jPrime] & COLOR) !== rookColor) {
        collectedCoords.push([i, jPrime]);
    }
    return collectedCoords;
}

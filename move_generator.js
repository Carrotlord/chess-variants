function outOfBounds(i, j) {
    return i < 0 || j < 0 || i >= BOARD_HEIGHT || j >= BOARD_WIDTH;
}

function filterLegalMoves(moves, movingColor, board) {
    return moves.filter((move) => {
        let [i, j] = move;
        if (outOfBounds(i, j) || (board[i][j] & COLOR) === movingColor) {
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


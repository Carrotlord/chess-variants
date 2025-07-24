const CHAR_CODE_a = "a".charCodeAt(0);
const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;

/**
 * Square IDs are integers:
 * 0  1  2  3  4  5  6  7
 * 8  9  10 11 12 ...
 * ... ...
 * 56 57 58 59 60 61 62 63
 *
 * This corresponds to algebraic chess notation:
 * a8 b8 c8 d8 e8 f8 g8 h8
 * a7 b7 c7 d7 e7 ...
 * ... ...
 * a1 b1 c1 d1 e1 f1 g1 h1
 *
 * As well as coordinate pairs for nested array indexing:
 * [0,0] [0,1] [0,2] ...
 * ...
 * [7,0] [7,1] [7,2] ... 
 */
function toID(square) {
    if (Array.isArray(square)) {
        return (BOARD_WIDTH * square[0]) + square[1];
    } else if (typeof(square) === "string") {
        let letter = square[0];
        let digit = square[1];
        let horizontal = letter.charCodeAt(0) - CHAR_CODE_a;
        let vertical = BOARD_HEIGHT - parseInt(digit, 10);
        return (BOARD_WIDTH * vertical) + horizontal;
    }
}

function toAlgebraic(square) {
    if (Array.isArray(square)) {
        // Concat string with number
        return "abcdefgh"[square[1]] + (BOARD_HEIGHT - square[0]);
    } else if (typeof(square) === "number") {
        return "abcdefgh"[square % BOARD_WIDTH] + Math.floor(BOARD_HEIGHT - square/BOARD_WIDTH);
    }
}

function toCoords(square) {
    if (typeof(square) === "string") {
        let letter = square[0];
        let digit = square[1];
        let horizontal = letter.charCodeAt(0) - CHAR_CODE_a;
        let vertical = BOARD_HEIGHT - parseInt(digit, 10);
        return [vertical, horizontal];
    } else if (typeof(square) === "number") {
        return [Math.floor(BOARD_HEIGHT - square/BOARD_WIDTH), square % BOARD_WIDTH]
    }
}

function initializeBoard() {
}

function startUp() {
    initializeBoard();
    testCoordConversions();
}
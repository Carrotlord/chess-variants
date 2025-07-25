const CHAR_CODE_a = "a".charCodeAt(0);
const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;

const COLOR = 0x3; // bitwise mask for piece color (or empty)
const KIND = 0x1C;  // bitwise mask for piece kind

const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;
const KING = 1 << 2;
const QUEEN = 2 << 2;
const ROOK = 3 << 2;
const BISHOP = 4 << 2;
const KNIGHT = 5 << 2;
const PAWN = 6 << 2;

const BLACK_KING = BLACK | KING;
const BLACK_QUEEN = BLACK | QUEEN;
const BLACK_ROOK = BLACK | ROOK;
const BLACK_BISHOP = BLACK | BISHOP;
const BLACK_KNIGHT = BLACK | KNIGHT;
const BLACK_PAWN = BLACK | PAWN;

const WHITE_KING = WHITE | KING;
const WHITE_QUEEN = WHITE | QUEEN;
const WHITE_ROOK = WHITE | ROOK;
const WHITE_BISHOP = WHITE | BISHOP;
const WHITE_KNIGHT = WHITE | KNIGHT;
const WHITE_PAWN = WHITE | PAWN;

const PIECE_SYMBOLS = {
    [EMPTY]: "",
    [BLACK_KING]: "&#x265a;", [BLACK_QUEEN]: "&#x265b;", [BLACK_ROOK]: "&#x265c;",
    [BLACK_BISHOP]: "&#x265d;", [BLACK_KNIGHT]: "&#x265e;", [BLACK_PAWN]: "&#x265f;",
    [WHITE_KING]: "&#x2654;", [WHITE_QUEEN]: "&#x2655;", [WHITE_ROOK]: "&#x2656;",
    [WHITE_BISHOP]: "&#x2657;", [WHITE_KNIGHT]: "&#x2658;", [WHITE_PAWN]: "&#x2659;"
};
const NO_SELECTION = -1;

class Board {
    constructor(graphicalBoard) {
        this.graphicalBoard = graphicalBoard;
        this.grid = [
            [BLACK_ROOK, BLACK_KNIGHT, BLACK_BISHOP, BLACK_QUEEN, BLACK_KING, BLACK_BISHOP, BLACK_KNIGHT, BLACK_ROOK],
            [BLACK_PAWN, BLACK_PAWN,   BLACK_PAWN,   BLACK_PAWN,  BLACK_PAWN, BLACK_PAWN,   BLACK_PAWN,   BLACK_PAWN],
            [EMPTY,      EMPTY,        EMPTY,        EMPTY,       EMPTY,      EMPTY,        EMPTY,        EMPTY],
            [EMPTY,      EMPTY,        EMPTY,        EMPTY,       EMPTY,      EMPTY,        EMPTY,        EMPTY],
            [EMPTY,      EMPTY,        EMPTY,        EMPTY,       EMPTY,      EMPTY,        EMPTY,        EMPTY],
            [EMPTY,      EMPTY,        EMPTY,        EMPTY,       EMPTY,      EMPTY,        EMPTY,        EMPTY],
            [WHITE_PAWN, WHITE_PAWN,   WHITE_PAWN,   WHITE_PAWN,  WHITE_PAWN, WHITE_PAWN,   WHITE_PAWN,   WHITE_PAWN],
            [WHITE_ROOK, WHITE_KNIGHT, WHITE_BISHOP, WHITE_QUEEN, WHITE_KING, WHITE_BISHOP, WHITE_KNIGHT, WHITE_ROOK]
        ];
        this.colors = {};
        this.nextMoves = [];
        this.selectedPieceID = NO_SELECTION;
    }

    addColorLayer(squareID, colorString) {
        let key = "" + squareID;
        if (this.colors.hasOwnProperty(key)) {
            this.colors[key].push(colorString);
        } else {
            this.colors[key] = [colorString];
        }
    }

    popColorLayer(squareID) {
        let key = "" + squareID;
        if (this.colors.hasOwnProperty(key) && this.colors[key].length > 0) {
            return this.colors[key].pop();
        }
        return null;
    }

    getColorLayer(squareID) {
        let key = "" + squareID;
        if (this.colors.hasOwnProperty(key) && this.colors[key].length > 0) {
            return this.colors[key].at(-1);
        }
        return "white_tile";
    }

    eraseColorFromAll(colorString) {
        for (let key in this.colors) {
            if (this.colors.hasOwnProperty(key)) {
                this.colors[key] = this.colors[key].filter(color => color !== colorString);
            }
        }
    }

    resetMoves() {
        this.eraseColorFromAll("move_to_tile");
        this.nextMoves = [];
    }

    showMovesForPiece(i, j, squareID) {
        this.resetMoves();
        let piece = this.grid[i][j];
        switch (piece & KIND) {
            case KNIGHT:
                this.nextMoves = filterLegalMoves(getKnightMoves(i, j), WHITE, this.grid).map(toID);
                break;
            case KING:
                this.nextMoves = filterLegalMoves(getKingMoves(i, j), WHITE, this.grid).map(toID);
                break;
        }
        for (let move of this.nextMoves) {
            this.addColorLayer(move, "move_to_tile");
        }
        this.selectedPieceID = squareID;
    }

    makeMove(destination) {
        if (this.selectedPieceID !== NO_SELECTION) {
            let [i, j] = toCoords(this.selectedPieceID);
            let [iPrime, jPrime] = toCoords(destination);
            this.grid[iPrime][jPrime] = this.grid[i][j]; // move the piece
            this.grid[i][j] = EMPTY; // delete the old piece
            this.selectedPieceID = NO_SELECTION;
            this.resetMoves();
        }
    }

    toggleSquare(squareID) {
        let key = "" + squareID;
        if (squareID === this.selectedPieceID) {
            this.popColorLayer(squareID);
            this.resetMoves();
            this.render();
            return;
        }
        let [i, j] = toCoords(squareID);
        let piece = this.grid[i][j];
        this.eraseColorFromAll("opponents_selected_tile");
        this.eraseColorFromAll("selected_tile");
        if (this.nextMoves.includes(squareID)) {
            this.makeMove(squareID);
        } else if (piece & BLACK) {
            this.addColorLayer(squareID, "opponents_selected_tile");
        } else {
            this.addColorLayer(squareID, "selected_tile");
            this.showMovesForPiece(i, j, squareID);
        }
        this.render();
    }

    render() {
        for (let id = 0; id < 64; id++) {
            let cell = document.getElementById("s" + id);
            cell.className = this.getColorLayer(id) + " piece";
            let [i, j] = toCoords(id);
            let piece = this.grid[i][j];
            cell.innerHTML = PIECE_SYMBOLS[piece];
        }
    }
}

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
        return "abcdefgh"[square % BOARD_WIDTH] + (BOARD_HEIGHT - Math.floor(square/BOARD_WIDTH));
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
        return [Math.floor(square/BOARD_WIDTH), square % BOARD_WIDTH]
    }
}

function initializeBoardColors(board, i, j, squareID) {
    let iEven = (i & 1) == 0;
    let jEven = (j & 1) == 0;
    if ((iEven && !jEven) || (!iEven && jEven)) {
        board.addColorLayer(squareID, "blue_tile");
    }
}

function initializeBoard() {
    let graphicalBoard = document.getElementById("chessboard");
    let board = new Board(graphicalBoard);
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < BOARD_WIDTH; j++) {
            let cell = document.createElement("td");
            row.appendChild(cell);
            let currentID = toID([i, j]);
            initializeBoardColors(board, i, j, currentID);
            cell.id = "s" + currentID;
            // We are capturing currentID, so it's important
            // that currentID is declared as 'let' and not 'var'
            // inside this for-loop block
            cell.addEventListener("click", () => board.toggleSquare(currentID));
        }
        graphicalBoard.appendChild(row);
    }
    return board;
}

function startUp() {
    let board = initializeBoard();
    testCoordConversions();
    board.render();
}

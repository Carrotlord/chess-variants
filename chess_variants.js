const CHAR_CODE_a = "a".charCodeAt(0);
const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;

const COLOR = 0x3;  // bitwise mask for piece color (or empty)
const KIND = 0x1C;  // bitwise mask for piece kind
const MOVING_PIECE = 0x1f;         // 5 bits to represent a piece (including color)
const CAPTURED_PIECE = 0x1f << 5;  // Another 5 bits for the taken piece
const START_POSITION = 0x3f << 10; // 6 bits to represent a square ID
const END_POSITION = 0x3f << 16;   // Another 6 bits for the destination square ID
const FAR_CASTLE = 1 << 22;        // This move is a queenside castle
const NEAR_CASTLE = 1 << 23;       // This move is a kingside castle
const PAWN_PROMOTE = 1 << 24;      // This move is a pawn promotion (check MOVING_PIECE for what the promoted piece is)
const EN_PASSANT = 1 << 25;        // This move is en passant
const SHIFT_AMOUNT = {
    [MOVING_PIECE]: 0, [CAPTURED_PIECE]: 5, [START_POSITION]: 10,
    [END_POSITION]: 16, [FAR_CASTLE]: 22, [NEAR_CASTLE]: 23,
    [PAWN_PROMOTE]: 24, [EN_PASSANT]: 25
};

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

function getMoves(piece, i, j, color, grid) {
    switch (piece & KIND) {
        case KING:
            return filterLegalMoves(getKingMoves(i, j), color, grid).map(toID);
        case QUEEN:
            return getQueenMoves(i, j, grid).map(toID);
        case ROOK:
            return getRookMoves(i, j, grid).map(toID);
        case BISHOP:
            return getBishopMoves(i, j, grid).map(toID);
        case KNIGHT:
            return filterLegalMoves(getKnightMoves(i, j), color, grid).map(toID);
        case PAWN:
            return getPawnMoves(i, j, grid).map(toID);
    }
    return [];
}

class Board {
    constructor(graphicalBoard) {
        this.graphicalBoard = graphicalBoard;
        this.resetData();
    }

    resetData() {
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
        this.opponent = new RandomMoveAI(this);
        this.cachedKingPositionID = toID("e1"); // The white king starts on "e1"
        this.moveHistory = [];
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
        this.nextMoves = getMoves(piece, i, j, WHITE, this.grid);
        for (let move of this.nextMoves) {
            this.addColorLayer(move, "move_to_tile");
        }
        this.selectedPieceID = squareID;
    }

    encodeMove(piece, captured, start, end, farCastle, nearCastle, promote, enPassant) {
        let savedMove = piece;
        savedMove |= captured << SHIFT_AMOUNT[CAPTURED_PIECE];
        savedMove |= start << SHIFT_AMOUNT[START_POSITION];
        savedMove |= end << SHIFT_AMOUNT[END_POSITION];
        savedMove |= (farCastle ? 1 : 0) << SHIFT_AMOUNT[FAR_CASTLE];
        savedMove |= (nearCastle ? 1 : 0) << SHIFT_AMOUNT[NEAR_CASTLE];
        savedMove |= (promote ? 1 : 0) << SHIFT_AMOUNT[PAWN_PROMOTE];
        savedMove |= (enPassant ? 1 : 0) << SHIFT_AMOUNT[EN_PASSANT];
        return savedMove;
    }

    decodeMove(savedMove) {
        return [
            savedMove & MOVING_PIECE,
            (savedMove & CAPTURED_PIECE) >> SHIFT_AMOUNT[CAPTURED_PIECE],
            (savedMove & START_POSITION) >> SHIFT_AMOUNT[START_POSITION],
            (savedMove & END_POSITION) >> SHIFT_AMOUNT[END_POSITION],
            Boolean(savedMove & FAR_CASTLE),
            Boolean(savedMove & NEAR_CASTLE),
            Boolean(savedMove & PAWN_PROMOTE),
            Boolean(savedMove & EN_PASSANT)
        ];
    }

    makeMove(destination) {
        if (this.selectedPieceID === NO_SELECTION) {
            return;
        }
        let [i, j] = toCoords(this.selectedPieceID);
        let [iPrime, jPrime] = toCoords(destination);
        let piece = this.grid[i][j];
        let captured = this.grid[iPrime][jPrime];
        // Promote pawns:
        let promoted = false;
        if (iPrime === 0 && piece === WHITE_PAWN) {
            // TODO: a player can promote this pawn
            // to a rook, bishop, or knight too
            piece = WHITE_QUEEN;
            promoted = true;
        } else if (iPrime === BOARD_HEIGHT - 1 && piece === BLACK_PAWN) {
            piece = BLACK_QUEEN;
            promoted = true;
        }
        this.grid[iPrime][jPrime] = piece; // move the piece
        this.grid[i][j] = EMPTY; // delete the old piece
        this.moveHistory.push(this.encodeMove(
            piece, captured, this.selectedPieceID, destination, false, false, promoted, false
        ));
        this.selectedPieceID = NO_SELECTION;
    }

    undoMove() {
        if (this.moveHistory.length === 0) {
            return null;
        }
        let lastMove = this.moveHistory.pop();
        let [piece, captured, start, end, farCastle, nearCastle, promote, enPassant] = this.decodeMove(lastMove);

        let [i, j] = toCoords(start);
        let [iPrime, jPrime] = toCoords(end);
        // Undo pawn promotion:
        if (promote) {
            piece = piece & BLACK ? BLACK_PAWN : WHITE_PAWN;
        }
        this.grid[iPrime][jPrime] = captured; // revive the captured piece
        this.grid[i][j] = piece; // take the moved piece and put it back
        // Return the squares we changed (for highlighting)
        return {piece: [i, j], capture: captured === EMPTY ? null : [iPrime, jPrime]}
    }

    toggleSquare(squareID) {
        this.eraseColorFromAll("undo_tile");
        this.eraseColorFromAll("undo_capture");
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
            // We're making a move so don't mark the opponent's move anymore
            this.eraseColorFromAll("opponent_moved_tile");
            this.makeMove(squareID);
            this.resetMoves(); // clear the UI
            // The opponent will move immediately after
            this.opponent.chooseMove();
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

function highlightUndoPly(ply, board) {
    if (ply !== null) {
        board.addColorLayer(toID(ply.piece), "undo_tile");
        if (ply.capture !== null) {
            board.addColorLayer(toID(ply.capture), "undo_capture");
        }
    }
}

function startUp() {
    let board = initializeBoard();
    testCoordConversions();
    board.render();
    document.getElementById("undo_move").addEventListener("click", () => {
        // When we undo a move, we are actually undoing a "ply"
        // which is a half-move by either black or white.
        // To undo both the player's move and the opponent's move,
        // we undo the ply twice:
        let firstPly = board.undoMove();
        let secondPly = board.undoMove();
        board.eraseColorFromAll("opponent_moved_tile");
        board.eraseColorFromAll("undo_tile");
        board.eraseColorFromAll("undo_capture");
        board.eraseColorFromAll("opponents_selected_tile");
        board.eraseColorFromAll("selected_tile");
        board.eraseColorFromAll("move_to_tile");
        board.nextMoves = [];
        highlightUndoPly(firstPly, board);
        highlightUndoPly(secondPly, board);
        board.render();
    });
}

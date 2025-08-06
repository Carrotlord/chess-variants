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

    resetData(aiName = null) {
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
        this.showCoordinates = false;
        this.colors = {};
        this.nextMoves = [];     // Valid moves
        this.invalidMoves = [];  // Moves that would put the king in check
        this.selectedPieceID = NO_SELECTION;
        if (aiName === "human") {
            this.opponent = new HumanPlayer(this);
        } else if (aiName === "easy") {
            this.opponent = new NoviceAI(this);
        } else if (aiName === "advanced") {
            this.opponent = new AdvancedAI(this);
        } else {
            this.opponent = new IntermediateAI(this);
        }
        this.cachedWhiteKingPositionID = anyToID("e1"); // The white king starts on "e1"
        this.cachedBlackKingPositionID = anyToID("e8"); // The black king starts on "e8"
        this.moveHistory = [];
        this.whoseMove = WHITE;
        this.gameOver = false;
        this.spectating = false;
        this.diagnostics = null;
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
        this.eraseColorFromAll("invalid_move_to_tile");
        this.nextMoves = [];
        this.invalidMoves = [];
    }

    showMovesForPiece(i, j, squareID) {
        this.resetMoves();
        let piece = this.grid[i][j];
        this.selectedPieceID = squareID;
        let potentialMoves = getMoves(piece, i, j, this.whoseMove, this.grid);
        for (let move of potentialMoves) {
            if (isKingInCheckAfterMove(this, squareID, move, this.whoseMove)) {
                this.addColorLayer(move, "invalid_move_to_tile");
                this.invalidMoves.push(move);
            } else {
                this.addColorLayer(move, "move_to_tile");
                this.nextMoves.push(move);
            }
        }
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

    makeMove(origin, destination) {
        let [i, j] = toCoords(origin);
        let [iPrime, jPrime] = toCoords(destination);
        let piece = this.grid[i][j];
        if ((piece & KIND) === KING) {
            // Save the new position of the king
            if (piece & BLACK) {
                this.cachedBlackKingPositionID = toID2(iPrime, jPrime);
            } else {
                this.cachedWhiteKingPositionID = toID2(iPrime, jPrime);
            }
        }
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
            piece, captured, origin, destination, false, false, promoted, false
        ));
    }

    undoMove() {
        if (this.moveHistory.length === 0) {
            return null;
        }
        let lastMove = this.moveHistory.pop();
        let [piece, captured, start, end, farCastle, nearCastle, promote, enPassant] = this.decodeMove(lastMove);

        let [i, j] = toCoords(start);
        let [iPrime, jPrime] = toCoords(end);
        if ((piece & KIND) === KING) {
            // Restore the previous position of the king
            if (piece & BLACK) {
                this.cachedBlackKingPositionID = toID2(i, j);
            } else {
                this.cachedWhiteKingPositionID = toID2(i, j);
            }
        }
        // Undo pawn promotion:
        if (promote) {
            piece = piece & BLACK ? BLACK_PAWN : WHITE_PAWN;
        }
        this.grid[iPrime][jPrime] = captured; // revive the captured piece
        this.grid[i][j] = piece; // take the moved piece and put it back
        // Return the squares we changed (for highlighting)
        return {piece: [i, j], capture: captured === EMPTY ? null : [iPrime, jPrime]}
    }

    startNewGame() {
        closeDialog();
        this.opponent.gameOver();
    }

    backToGame() {
        closeDialog();
        this.gameOver = true;
    }

    isOpponentPiece(piece) {
        return piece !== EMPTY && this.whoseMove !== (piece & COLOR);
    }

    concludeGameWithAI() {
        if (detectKingInCheck(this, this.whoseMove) === null) {
            showDialog(
                ["You have no legal moves,", "but are not in check. Stalemate!"],
                "Start new game", this.startNewGame.bind(this),
                "Back to game", this.backToGame.bind(this)
            );
        } else {
            showDialog(
                ["You have lost to checkmate.", "The opponent wins!"],
                "Start new game", this.startNewGame.bind(this),
                "Back to game", this.backToGame.bind(this)
            );
        }
    }

    concludeGameWithHuman(losingPlayer) {
        if (detectKingInCheck(this, losingPlayer) === null) {
            let loser = losingPlayer === WHITE ? "Player 1 (white)" : "Player 2 (black)";
            showDialog(
                [`${loser} has no legal moves,`, "but is not in check. Stalemate!"],
                "Start new game", this.startNewGame.bind(this),
                "Back to game", this.backToGame.bind(this)
            );
        } else {
            let winner = losingPlayer !== WHITE ? "Player 1 (white)" : "Player 2 (black)";
            showDialog(
                ["Checkmate!", `${winner} wins!`],
                "Start new game", this.startNewGame.bind(this),
                "Back to game", this.backToGame.bind(this)
            );
        }
    }

    toggleSquare(squareID) {
        if (this.gameOver || this.spectating) {
            this.eraseColorFromAll("game_over_tile");
            this.addColorLayer(squareID, "game_over_tile");
            this.render();
            return;
        }
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
            if (this.selectedPieceID !== NO_SELECTION) {
                this.makeMove(this.selectedPieceID, squareID);
                this.selectedPieceID = NO_SELECTION;
            }
            this.resetMoves(); // clear the UI
            this.render();
            if (this.opponent.difficulty === "human") {
                let otherPlayer = this.whoseMove === WHITE ? BLACK : WHITE;
                if (hasNoLegalMoves(this, otherPlayer)) {
                    this.concludeGameWithHuman(otherPlayer);
                }
                this.whoseMove = otherPlayer;
            } else {
                // The AI opponent will move afterwards
                setTimeout(() => {
                    this.opponent.chooseMove();
                    this.render();
                    if (hasNoLegalMoves(this, this.whoseMove)) {
                        this.concludeGameWithAI();
                    }
                }, 1);
            }
        } else if (this.invalidMoves.includes(squareID)) {
            let [iTarget, jTarget] = toCoords(this.selectedPieceID);
            let targetPiece = this.grid[iTarget][jTarget];
            if ((targetPiece & KIND) !== KING && detectKingInCheck(this, WHITE) !== null) {
                showDialog(["You can't move there since", "your king is currently in check."], "Ok", closeDialog);
            } else {
                showDialog(["You can't move there since your king", "would be in check after the move."], "Ok", closeDialog);
            }
            this.selectedPieceID = NO_SELECTION;
            this.resetMoves();
        } else if (this.isOpponentPiece(piece)) {
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
            if (this.showCoordinates) {
                let algebraic = toAlgebraic(id);
                let span = document.createElement("span");
                span.className = "coordinate";
                span.appendChild(document.createTextNode(algebraic));
                cell.appendChild(span);
            }
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
function anyToID(square) {
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

function toID(square) {
    return (square[0] << 3) + square[1];
}

function toID2(i, j) {
    return (i << 3) + j;
}

function toAlgebraic(square) {
    if (Array.isArray(square)) {
        // Concat string with number
        return "abcdefgh"[square[1]] + (BOARD_HEIGHT - square[0]);
    } else if (typeof(square) === "number") {
        return "abcdefgh"[square % BOARD_WIDTH] + (BOARD_HEIGHT - Math.floor(square/BOARD_WIDTH));
    }
}

function anyToCoords(square) {
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

function toCoords(square) {
    return [square >> 3, square & 0x7];
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
            let currentID = toID2(i, j);
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

function makeReset(board, aiDifficulty) {
    return () => {
        board.resetData(aiDifficulty);
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            for (let j = 0; j < BOARD_WIDTH; j++) {
                initializeBoardColors(board, i, j, toID2(i, j));
            }
        }
        board.render();
    };
}

class GameDiagnostics {
    constructor() {
        this.repetitionTable = {};
        this.moveTimeForWhite = [];
        this.moveTimeForBlack = [];
    }

    detectRepetition(board, currentColor) {
        let key = boardToString(board) + (currentColor === WHITE ? "W" : "B");
        if (this.repetitionTable.hasOwnProperty(key)) {
            if (this.repetitionTable[key] >= 2) {
                return true; // threefold repetition detected
            }
            this.repetitionTable[key]++;
        } else {
            this.repetitionTable[key] = 1;
        }
        return false;
    }

    logMoveTimeForPlayer(color, time) {
        if (color === WHITE) {
            this.moveTimeForWhite.push(time);
        } else {
            this.moveTimeForBlack.push(time);
        }
    }

    average(array) {
        return array.reduce((a,b) => a+b, 0) / array.length;
    }

    reportMoveTime() {
        let whiteTimeAverage = this.average(this.moveTimeForWhite);
        let blackTimeAverage = this.average(this.moveTimeForBlack);
        let whiteTimeMax = Math.max(...this.moveTimeForWhite);
        let blackTimeMax = Math.max(...this.moveTimeForBlack);
        let whiteTimeMin = Math.min(...this.moveTimeForWhite);
        let blackTimeMin = Math.min(...this.moveTimeForBlack);
        console.log(`Player white: ${whiteTimeAverage} average, ${whiteTimeMax} max, ${whiteTimeMin} min`);
        console.log(`Player black: ${blackTimeAverage} average, ${blackTimeMax} max, ${blackTimeMin} min`);
    }
}

function aiVersusAI(board) {
    const MIN_TIME_PER_MOVE = 750; // milliseconds
    let resetAll = makeReset(board, null);
    resetAll();
    board.diagnostics = new GameDiagnostics();
    let playerOne = new AdvancedAI(board);
    let playerTwo = new IntermediateAI(board);
    let functionFactory = (player, color) => () => {
        let startTime = Date.now();
        if (!board.spectating) {
            return;
        }
        board.eraseColorFromAll("opponent_moved_tile");
        player.chooseMove(color);
        board.render();
        if (board.diagnostics.detectRepetition(board, color)) {
            player.threefoldRepetition();
        }
        let endTime = Date.now();
        let difference = endTime - startTime;
        board.diagnostics.logMoveTimeForPlayer(color, difference);
        if (difference >= MIN_TIME_PER_MOVE) {
            return 1;
        } else if (difference < 0) {
            // Since the user can change the clock,
            // the difference is not guaranteed to be positive
            return 1 + MIN_TIME_PER_MOVE;
        }
        return 1 + MIN_TIME_PER_MOVE - difference;
    };
    let playerOneAction = functionFactory(playerOne, WHITE);
    let playerTwoAction = functionFactory(playerTwo, BLACK);
    let playerOneMove;
    let playerTwoMove;
    playerOneMove = () => {
        let delay = playerOneAction();
        if (board.spectating) {
            setTimeout(playerTwoMove, delay);
        }
    };
    playerTwoMove = () => {
        let delay = playerTwoAction();
        if (board.spectating) {
            setTimeout(playerOneMove, delay);
        }
    };
    board.spectating = true;
    playerOneMove();
}

/** Add event listeners for clickable buttons */
function setupButtons(board) {
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
        board.eraseColorFromAll("invalid_move_to_tile");
        board.eraseColorFromAll("game_over_tile");
        board.nextMoves = [];
        board.invalidMoves = [];
        highlightUndoPly(firstPly, board);
        highlightUndoPly(secondPly, board);
        board.gameOver = false; // can continue after undoing a checkmate or stalemate
        board.render();
    });
    document.getElementById("show_coords").addEventListener("click", (eventObj) => {
        let elem = eventObj.target;
        if (elem.firstChild.nodeValue === "Show coordinates") {
            board.showCoordinates = true;
            elem.firstChild.nodeValue = "Hide coordinates";
        } else {
            board.showCoordinates = false;
            elem.firstChild.nodeValue = "Show coordinates";
        }
        board.render();
    });
    document.getElementById("easy_AI").addEventListener("click", makeReset(board, "easy"));
    document.getElementById("medium_AI").addEventListener("click", makeReset(board, "medium"));
    document.getElementById("advanced_AI").addEventListener("click", makeReset(board, "advanced"));
    document.getElementById("human").addEventListener("click", makeReset(board, "human"));
    document.getElementById("both_AI").addEventListener("click", () => aiVersusAI(board));
}

let debugGetBoard;

function startUp() {
    let board = initializeBoard();
    board.render();
    setupButtons(board);
    debugGetBoard = () => board;
}

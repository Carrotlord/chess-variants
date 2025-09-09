function printHalfBitBoard(bitField) {
    let str = "";
    // The lowest bit is at the upper left corner
    for (let row = 0; row < 4; row++) {
        str += "    ";  // indent
        for (let cell = 0; cell < 8; cell++) {
            str += (bitField & 1) ? "1" : ".";
            bitField >>>= 1;
        }
        str += "\n";
    }
    console.log(str);
}

function printBitBoard(bitBoard) {
    let [high, low] = bitBoard;
    printHalfBitBoard(low);
    printHalfBitBoard(high);
}

function mask(bitBoard, bitBoard2) {
    return [bitBoard[0] & bitBoard2[0], bitBoard[1] & bitBoard2[1]];
}

function combine(bitBoard, bitBoard2) {
    return [bitBoard[0] | bitBoard2[0], bitBoard[1] | bitBoard2[1]];
}

function combine3(bitBoard, bitBoard2, bitBoard3) {
    return combine(bitBoard, combine(bitBoard2, bitBoard3));
}

function equalBoards(bitBoard, bitBoard2) {
    return bitBoard[0] === bitBoard2[0] && bitBoard[1] === bitBoard2[1];
}

function setBitAt(bitBoard, i, j) {
    if (outOfBounds(i, j)) {
        return;
    }
    let id = toID2(i, j);
    if (id >= 32) {
        bitBoard[0] |= 1 << (id - 32);
    } else {
        bitBoard[1] |= 1 << id;
    }
}

function clearBitAt(bitBoard, i, j) {
    if (outOfBounds(i, j)) {
        return;
    }
    let id = toID2(i, j);
    if (id >= 32) {
        bitBoard[0] &= ~(1 << (id - 32));
    } else {
        bitBoard[1] &= ~(1 << id);
    }
}

function drawHorizontalLine(bitBoard, rowIndex) {
    if (rowIndex >= 4) {
        bitBoard[0] |= 0xFF << ((rowIndex - 4) << 3);
    } else {
        bitBoard[1] |= 0xFF << (rowIndex << 3);
    }
}

function drawVerticalLine(bitBoard, columnIndex) {
    // We need to set a bit once every 8 squares
    for (let i = 0; i < 8; i++) {
        setBitAt(bitBoard, i, columnIndex);
    }
}

function makeRookVisionBitBoard(rookID) {
    let [i, j] = toCoords(rookID);
    let bitBoard = [0, 0];
    drawHorizontalLine(bitBoard, i);
    drawVerticalLine(bitBoard, j);
    return bitBoard;
}

function makeBishopVisionBitBoard(bishopID) {
    let [i, j] = toCoords(bishopID);
    let bitBoard = [0, 0];
    let iPrime = i;
    let jPrime = j;
    while (!outOfBounds(iPrime, jPrime)) {
        setBitAt(bitBoard, iPrime, jPrime);
        iPrime++;
        jPrime++;
    }
    iPrime = i - 1;
    jPrime = j - 1;
    while (!outOfBounds(iPrime, jPrime)) {
        setBitAt(bitBoard, iPrime, jPrime);
        iPrime--;
        jPrime--;
    }
    iPrime = i + 1;
    jPrime = j - 1;
    while (!outOfBounds(iPrime, jPrime)) {
        setBitAt(bitBoard, iPrime, jPrime);
        iPrime++;
        jPrime--;
    }
    iPrime = i - 1;
    jPrime = j + 1;
    while (!outOfBounds(iPrime, jPrime)) {
        setBitAt(bitBoard, iPrime, jPrime);
        iPrime--;
        jPrime++;
    }
    return bitBoard;
}

function makeKnightVisionBitBoard(knightID) {
    let moves = COMPUTED_KNIGHT_MOVES[knightID];
    let bitBoard = [0, 0];
    for (let move of moves) {
        setBitAt(bitBoard, move[0], move[1]);
    }
    return bitBoard;
}

function makeKingVisionBitBoard(kingID) {
    let moves = COMPUTED_KING_MOVES[kingID];
    let bitBoard = [0, 0];
    for (let move of moves) {
        setBitAt(bitBoard, move[0], move[1]);
    }
    return bitBoard;
}

function makePawnVisionBitBoard(pawnID, color) {
    let [i, j] = toCoords(pawnID);
    let bitBoard = [0, 0];
    setBitAt(bitBoard, i, j);
    // TODO: extend this for en passant
    if (color === WHITE) {
        setBitAt(bitBoard, i - 1, j);
        setBitAt(bitBoard, i - 2, j);
        setBitAt(bitBoard, i - 1, j - 1);
        setBitAt(bitBoard, i - 1, j + 1);
    } else {
        setBitAt(bitBoard, i + 1, j);
        setBitAt(bitBoard, i + 2, j);
        setBitAt(bitBoard, i + 1, j - 1);
        setBitAt(bitBoard, i + 1, j + 1);
    }
    return bitBoard;
}

function makeWhitePiecesStartingBitBoard() {
    let bitBoard = [0, 0];
    drawHorizontalLine(bitBoard, 6);
    drawHorizontalLine(bitBoard, 7);
    return bitBoard;
}

function makeBlackPiecesStartingBitBoard() {
    let bitBoard = [0, 0];
    drawHorizontalLine(bitBoard, 0);
    drawHorizontalLine(bitBoard, 1);
    return bitBoard;
}

function computeBitBoards(generate) {
    let computed = [];
    for (let id = 0; id < 64; id++) {
        computed.push(generate(id));
    }
    return computed;
}

let PAWN_VISION_WHITE = computeBitBoards(pawnID => makePawnVisionBitBoard(pawnID, WHITE));
let PAWN_VISION_BLACK = computeBitBoards(pawnID => makePawnVisionBitBoard(pawnID, BLACK));
let KNIGHT_VISION = computeBitBoards(makeKnightVisionBitBoard);
let BISHOP_VISION = computeBitBoards(makeBishopVisionBitBoard);
let ROOK_VISION = computeBitBoards(makeRookVisionBitBoard);
let QUEEN_VISION = computeBitBoards(queenID =>
   combine(
       makeBishopVisionBitBoard(queenID),
       makeRookVisionBitBoard(queenID)
   )
);
let KING_VISION = computeBitBoards(makeKingVisionBitBoard);
let CHECK_VISION = computeBitBoards(kingID =>
   combine3(
       makeBishopVisionBitBoard(kingID),
       makeRookVisionBitBoard(kingID),
       makeKnightVisionBitBoard(kingID)
   )
);

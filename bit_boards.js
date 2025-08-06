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

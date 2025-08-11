function testCoordConversions() {
    let results = "";
    let numbers = "";
    for (let i = 0; i < 64; i++) {
        results += toAlgebraic(i) + " ";
        numbers += toID(toAlgebraic(i)) + " ";
        if ((i+1) % 8 === 0) {
            results += "\n";
            numbers += "\n";
        }
    }
    console.log(results);
    console.log(numbers);
    results = "";
    numbers = "";
    for (let i = 0; i < 64; i++) {
        results += `[${toCoords(i)}] `;
        numbers += toID(toCoords(i)) + " ";
        if ((i+1) % 8 === 0) {
            results += "\n";
            numbers += "\n";
        }
    }
    console.log(results);
    console.log(numbers);
}

function testDialog() {
    showDialog(
        ["Message", "Line 1", "Line 2"],
        "Left",  () => { console.log("One"); closeDialog(); },
        "Right", () => { console.log("Two"); closeDialog(); }
    );
}

function testVisionBitBoards() {
    let squares = ["e1", "a8", "h1", "e5"];
    for (let square of squares) {
        let id = anyToID(square);
        let [i, j] = toCoords(id);
        console.log(`King at ${square}:`);
        let kingVision = makeKingVisionBitBoard(id);
        printBitBoard(kingVision);
        console.log(`Knight at ${square}:`);
        let knightVision = makeKnightVisionBitBoard(id);
        printBitBoard(knightVision);
        console.log(`Rook at ${square}:`);
        let rookVision = makeRookVisionBitBoard(id);
        printBitBoard(rookVision);
        console.log(`Bishop at ${square}:`);
        let bishopVision = makeBishopVisionBitBoard(id);
        printBitBoard(bishopVision);
        console.log(`White pawn at ${square}:`);
        printBitBoard(makePawnVisionBitBoard(id, WHITE));
        console.log(`Black pawn at ${square}:`);
        printBitBoard(makePawnVisionBitBoard(id, BLACK));
        console.log("White start position:");
        printBitBoard(makeWhitePiecesStartingBitBoard());
        console.log("Black start position:");
        printBitBoard(makeBlackPiecesStartingBitBoard());

        console.log(`Rook2 at ${square}:`);
        clearBitAt(rookVision, i, j);
        printBitBoard(rookVision);
        console.log(`Bishop2 at ${square}:`);
        clearBitAt(bishopVision, i, j);
        printBitBoard(bishopVision);
    }
}

function testLineBetweenSquares() {
    let horizontal = lineBetweenSquares(0, 0, 0, 5);
    let horizontal2 = lineBetweenSquares(1, 2, 1, 6);
    let vertical = lineBetweenSquares(0, 0, 5, 0);
    let vertical2 = lineBetweenSquares(1, 2, 6, 2);
    let diagonal = lineBetweenSquares(2, 2, 5, 5);
    let diagonal2 = lineBetweenSquares(1, 6, 5, 2);
    let diagonal3 = lineBetweenSquares(1, 6, 6, 1);
    let diagonal4 = lineBetweenSquares(5, 5, 2, 2);
    let diagonal5 = lineBetweenSquares(5, 2, 1, 6);
    let diagonal6 = lineBetweenSquares(6, 1, 1, 6);
    for (let line of [horizontal, horizontal2, vertical, vertical2, diagonal,
                      diagonal2, diagonal3, diagonal4, diagonal5, diagonal6]) {
        let bitBoard = [0, 0];
        for (let id of line) {
            let [i, j] = toCoords(id);
            setBitAt(bitBoard, i, j);
        }
        printBitBoard(bitBoard);
        console.log("========");
    }
}

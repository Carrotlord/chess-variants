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
        console.log(`King at ${square}:`);
        printBitBoard(makeKingVisionBitBoard(id));
        console.log(`Knight at ${square}:`);
        printBitBoard(makeKnightVisionBitBoard(id));
        console.log(`Rook at ${square}:`);
        printBitBoard(makeRookVisionBitBoard(id));
    }
}

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
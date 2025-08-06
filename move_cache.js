function computeKingOrKnightMoves(getMovesCallback) {
    let computed = new Array(64);
    for (let id = 0; id < 64; id++) {
        let [i, j] = toCoords(id);
        computed[id] = getMovesCallback(i, j).filter(
            (coords) => !outOfBounds(coords[0], coords[1])
        );
    }
    return computed;
}

let COMPUTED_KNIGHT_MOVES = computeKingOrKnightMoves(getKnightMoves);
let COMPUTED_KING_MOVES = computeKingOrKnightMoves(getKingMoves);

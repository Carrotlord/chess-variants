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

function loadMoves(piece, i, j, color, board) {
    let id = toID2(i, j);
    let kind = piece & KIND;
    let pieceBitBoard = color === WHITE ? board.whitePieceBitBoard : board.blackPieceBitBoard;
    let bothBitBoards = combine(board.whitePieceBitBoard, board.blackPieceBitBoard);
    let state;
    switch (kind) {
        case KING:
            state = mask(KING_VISION[id], pieceBitBoard);
            break;
        case QUEEN:
            state = mask(QUEEN_VISION[id], bothBitBoards);
            break;
        case ROOK:
            state = mask(ROOK_VISION[id], bothBitBoards);
            break;
        case BISHOP:
            state = mask(BISHOP_VISION[id], bothBitBoards);
            break;
        case KNIGHT:
            state = mask(KNIGHT_VISION[id], pieceBitBoard);
            break;
        case PAWN:
            if (color === WHITE) {
                state = mask(PAWN_VISION_WHITE[id], bothBitBoards);
            } else {
                state = mask(PAWN_VISION_BLACK[id], bothBitBoards);
            }
            break;
        default:
            return []; // the piece is empty
    }
    if (board.moveCache[id][0] === state) {
        // Cache hit
        return board.moveCache[id][1];
    } else {
        // Cache miss, generate the moves from scratch
        let moves = getMovesGenerated(piece, i, j, color, board.grid);
        // Save the moves for next time
        board.moveCache[id] = [state, moves];
        return moves;
    }
}

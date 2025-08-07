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
    // TODO: there are some issues with the rest of this function,
    //       so for now, just return the results from before:
    return getMovesGenerated(piece, i, j, color, board.grid);
    
    let id = toID2(i, j);
    let kind = piece & KIND;
    let pieceBitBoard = color === WHITE ? board.whitePieceBitBoard : board.blackPieceBitBoard;
    let bothBitBoards = combine(board.whitePieceBitBoard, board.blackPieceBitBoard);
    /*if (board.moveCache[id] === null) {
        // Generate for the first time
        let moves = getMovesGenerated(piece, i, j, color, board.grid);
        switch (kind) {
            case KING:
                board.moveCache[id] = [KING_VISION[id] & pieceBitBoard, moves];
                break;
            case QUEEN:
                board.moveCache[id] = [QUEEN_VISION[id] & bothBitBoards, moves];
                break;
            case ROOK:
                board.moveCache[id] = [ROOK_VISION[id] & bothBitBoards, moves];
                break;
            case BISHOP:
                board.moveCache[id] = [BISHOP_VISION[id] & bothBitBoards, moves];
                break;
            case KNIGHT:
                board.moveCache[id] = [KNIGHT_VISION[id] & pieceBitBoard, moves];
                break;
            case PAWN:
                if (color === WHITE) {
                    board.moveCache[id] = [PAWN_VISION_WHITE[id] & bothBitBoards, moves];
                } else {
                    board.moveCache[id] = [PAWN_VISION_BLACK[id] & bothBitBoards, moves];
                }
                break;
            default:
                return []; // the piece is empty
        }
        return moves;
    }*/
    let state;
    switch (kind) {
        case KING:
            state = KING_VISION[id] & pieceBitBoard;
            break;
        case QUEEN:
            state = QUEEN_VISION[id] & bothBitBoards;
            break;
        case ROOK:
            state = ROOK_VISION[id] & bothBitBoards;
            break;
        case BISHOP:
            state = BISHOP_VISION[id] & bothBitBoards;
            break;
        case KNIGHT:
            state = KNIGHT_VISION[id] & pieceBitBoard;
            break;
        case PAWN:
            if (color === WHITE) {
                state = PAWN_VISION_WHITE[id] & bothBitBoards;
            } else {
                state = PAWN_VISION_BLACK[id] & bothBitBoards;
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

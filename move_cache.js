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
// The king moves for castling are always the same.
// We declare arrays here so that we don't need to allocate every time
// we get a castling move.
const WHITE_NEAR_CASTLE_COORDS = [anyToID("g1")];
const WHITE_FAR_CASTLE_COORDS = [anyToID("c1")];
const BLACK_NEAR_CASTLE_COORDS = [anyToID("g8")];
const BLACK_FAR_CASTLE_COORDS = [anyToID("c8")];
const WHITE_BOTH_CASTLE_COORDS = WHITE_NEAR_CASTLE_COORDS.concat(WHITE_FAR_CASTLE_COORDS);
const BLACK_BOTH_CASTLE_COORDS = BLACK_NEAR_CASTLE_COORDS.concat(BLACK_FAR_CASTLE_COORDS);

// These squares must be verified to make sure they contain no pieces
// and that the king does not move into or through check when castling.
// Note that the king on its own square already has a condition for check,
// so the king's own square is not included here:
const WHITE_NEAR_CASTLE_VERIFY = ["f1", "g1"].map(anyToID);
const WHITE_FAR_CASTLE_VERIFY = ["c1", "d1"].map(anyToID);
const BLACK_NEAR_CASTLE_VERIFY = ["f8", "g8"].map(anyToID);
const BLACK_FAR_CASTLE_VERIFY = ["c8", "d8"].map(anyToID);
// Also, we can't castle if something is blocking the rook:
const WHITE_FAR_CASTLE_ROOK_VERIFY = anyToID("b1");
const BLACK_FAR_CASTLE_ROOK_VERIFY = anyToID("b8");
const WHITE_NEAR_CASTLE_OBJ = {
    kingColor: WHITE,
    kingVerifyArray: WHITE_NEAR_CASTLE_VERIFY,
    rookVerify: -1
};
const BLACK_NEAR_CASTLE_OBJ = {
    kingColor: BLACK,
    kingVerifyArray: BLACK_NEAR_CASTLE_VERIFY,
    rookVerify: -1
};
const WHITE_FAR_CASTLE_OBJ = {
    kingColor: WHITE,
    kingVerifyArray: WHITE_FAR_CASTLE_VERIFY,
    rookVerify: WHITE_FAR_CASTLE_ROOK_VERIFY
};
const BLACK_FAR_CASTLE_OBJ = {
    kingColor: BLACK,
    kingVerifyArray: BLACK_FAR_CASTLE_VERIFY,
    rookVerify: BLACK_FAR_CASTLE_ROOK_VERIFY
};
const WHITE_LEFT_ROOK_START = anyToCoords("a1");
const WHITE_RIGHT_ROOK_START = anyToCoords("h1");
const BLACK_LEFT_ROOK_START = anyToCoords("a8");
const BLACK_RIGHT_ROOK_START = anyToCoords("h8");

const WHITE_LEFT_ROOK_START_ID = toID(WHITE_LEFT_ROOK_START);
const WHITE_RIGHT_ROOK_START_ID = toID(WHITE_RIGHT_ROOK_START);
const BLACK_LEFT_ROOK_START_ID = toID(BLACK_LEFT_ROOK_START);
const BLACK_RIGHT_ROOK_START_ID = toID(BLACK_RIGHT_ROOK_START);

const WHITE_LEFT_ROOK_END = anyToCoords("d1");
const WHITE_RIGHT_ROOK_END = anyToCoords("f1");
const BLACK_LEFT_ROOK_END = anyToCoords("d8");
const BLACK_RIGHT_ROOK_END = anyToCoords("f8");

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
        let moves = getMovesGenerated(piece, i, j, color, board);
        // Save the moves for next time
        board.moveCache[id] = [state, moves];
        return moves;
    }
}

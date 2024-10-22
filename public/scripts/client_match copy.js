//#region Classes

//Square
class Square {
    constructor(notation, td) {
        this.notation = notation;
        this.td = td;
    }
}

//Position
class Position {
    constructor(file, rank) {
        this.file = file;
        this.rank = rank;
        this.notation = file + rank;
    }
}

//Piece
class Piece {
    constructor(notation, color, name) {
        this.notation = notation;
        this.color = color;
        this.name = name;
        this.moved = false;
    }
}

//#endregion

//#region Variables

//Consts
const client = io();
const pieces = [];
const captureSound = new Audio('../sounds/Capture.mp3');
const moveSound = new Audio('../sounds/Move.mp3');

//Lets
let board;
let black, turn, selectedPiece, legalMoves;

//Main method
initializeBoard();
//scrollChatToBottom();
$('#messages-container').scrollTop($(document).height() * 1000);

//#endregion

//#region Initialize Board

//Master function to initialize the board:
async function initializeBoard() {

    //Join the socket.io room
    joinRoom();

    //Wait for server response, when sides are chosen, continue
    await colorDecided();

    //Build the board, and add pieces on top on the squares, also add on-click listeners
    buildBoard();
    addPieces();
    onClickPress();

    //Flip 180 degs
    if (black) {
        flipBoard();
    }
}

//Builds the board's files and ranks
function buildBoard() {

    //Helper method to determine square's background color
    function assignColor(r, f, td) {

        let color, colorClass;

        //Assign square color
        if (r % 2 == 0) {
            if (f % 2 == 0) {
                color = 'rgb(230, 210, 94)';
                colorClass = 'darkSquare';
            }
            else {
                color = 'rgb(230, 210, 94)';
                colorClass = 'darkSquare';
            }
        }

        else {
            if (f % 2 == 0) {
                color = 'rgb(230, 210, 94)';
                colorClass = 'darkSquare';
            }
            else {
                color = 'rgb(230, 210, 94)';
                colorClass = 'darkSquare';
            }
        }
        //Change the square's color based on modulus
        $(td).css('background', color);
        $(td).toggleClass(colorClass, true);
    }

    //Helper function to return the chess notation of a table square
    function getNotation(r, f) {
        switch (r) {
            case 0:
                r = 8;
                break;
            case 1:
                r = 7;
                break;
            case 2:
                r = 6;
                break;
            case 3:
                r = 5;
                break;
            case 4:
                r = 4;
                break;
            case 5:
                r = 3;
                break;
            case 6:
                r = 2;
                break;
            case 7:
                r = 1;
                break;
        }

        switch (f) {
            case 0:
                f = 'A';
                break;
            case 1:
                f = 'B';
                break;
            case 2:
                f = 'C';
                break;
            case 3:
                f = 'D';
                break;
            case 4:
                f = 'E';
                break;
            case 5:
                f = 'F';
                break;
            case 6:
                f = 'G';
                break;
            case 7:
                f = 'H';
                break;
        }

        return f + r;
    }

    //Build an 8x8 grid, each square will have: position('H3'), and might have a piece('black', 'pawn'):
    //Add 8 rows to the table:
    for (let r = 0; r < 8; r++) {

        $('#board').append('<tr></tr>');
        let row = $('#board')[0].children[r];

        //Add 8 squares to each row
        for (let f = 0; f < 8; f++) {
            let notation = getNotation(r, f);
            $(row).append(`<td id= \'${notation}\' ></td>`);
            let td = row.children[f];
            assignColor(r, f, td);
        }
    }
}

//Add the pieces and their images to the board
function addPieces() {

    // Loop through all squares in the board
    for (let i = 0; i < board.length; i++) {

        let file = board[i].notation.substring(0, 1);
        let rank = board[i].notation.substring(1, 2);
        let onRank1 = rank == 1;
        let onRank3 = rank == 3;
        let onRank6 = rank == 6;
        let onRank8 = rank == 8;

        // Ranks 1, 3, 6, and 8 have pieces
        if (onRank1 || onRank3 || onRank6 || onRank8) {

            // Variables
            let notation = board[i].notation;
            let pieceName, pieceColor;

            // White pieces on ranks 1 and 3
            if (onRank1 || onRank3) {
                pieceColor = 'white';
            }

            // Black pieces on ranks 6 and 8
            else {
                pieceColor = 'black';
            }

            // Pawns on ranks 3 and 6
            if (onRank3 || onRank6) {
                pieceName = 'pawn';
            }

            // Other pieces on ranks 1 and 8
            else if (onRank1 || onRank8) {

                // Rooks
                if (file == 'H' || file == 'A') {
                    pieceName = 'rook';
                }

                // Knights
                else if (file == 'B' || file == 'G') {
                    pieceName = 'knight';
                }

                // Bishops
                else if (file == 'F' || file == 'C') {
                    pieceName = 'bishop';
                }

                // Special logic for Kings and Queens
                else if (onRank1) {
                    if (file == 'E') {
                        pieceName = 'queen';  // White Queen on file 'E' on rank 1
                    }
                    else if (file == 'D') {
                        pieceName = 'king';   // White King on file 'D' on rank 1
                    }
                }

                else if (onRank8) {
                    if (file == 'D') {
                        pieceName = 'queen';  // Black Queen on file 'D' on rank 8
                    }
                    else if (file == 'E') {
                        pieceName = 'king';   // Black King on file 'E' on rank 8
                    }
                }
            }

            $(`#${notation}`).append(`<img class='${pieceColor}' src='../images/pieces/${pieceColor}_${pieceName}.png'>`);
        }
    }

    // Add pointer cursor on piece hover for white
    if (!black) {
        $('.white').toggleClass('clickable', true);
    }
}


//Flip the board 180 degrees for black
function flipBoard() {
    $('#board').toggleClass('rotated');
    $('img').toggleClass('rotated');
}

//#endregion

//#region Helper methods

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Wait for the server to determine sides
async function colorDecided() {
    return new Promise(async function (resolve) {
        while (black == undefined) {
            await sleep(10);
        }
        resolve();
    });
}

//Returns false only if an ally piece is on the square
function squareIsMoveable(notation, board, clientColor) {

    if (notation == -1 || notation == undefined || notation.length != 2 || notation[1] <= 0 || notation[1] >= 9) {
        return false;
    }

    let i = getSquareIndex(notation);

    if (i != - 1 && board[i].piece && board[i].piece.color == clientColor) {
        return false;
    }

    return true;
}

//Converts files to numbers and numbers to files
function fileConverter(mode, arg) {

    //Conver a number to file, i.e. 1 -> A, H -> 8
    if (mode == 'file') {
        switch (arg) {
            case 1:
                return 'A';
            case 2:
                return 'B';
            case 3:
                return 'C';
            case 4:
                return 'D';
            case 5:
                return 'E';
            case 6:
                return 'F';
            case 7:
                return 'G';
            case 8:
                return 'H';
        }
    }

    //Conver a file to a number, i.e. A -> 1, 8 -> H
    else if (mode == 'number') {
        switch (arg) {
            case 'A':
                return 1;
            case 'B':
                return 2;
            case 'C':
                return 3;
            case 'D':
                return 4;
            case 'E':
                return 5;
            case 'F':
                return 6;
            case 'G':
                return 7;
            case 'H':
                return 8;
        }
    }

    return -1;
}

function getBoardClone() {
    let newBoard = jQuery.extend(true, {}, board);
    newBoard.whiteKing = board.whiteKing;
    newBoard.blackKing = board.blackKing;
    return newBoard;
}

function scrollChatToBottom() {
    $('#messages').scrollTop($(document).height() * 1000);
}

//#endregion


//#region Server communication

//Assign sides and receive the board
client.on('assignSides', (blackSide, defaultBoard) => {

    // Client is white
    if (!blackSide) {
        black = false;
        turn = true;
        document.title = 'Your turn!';
    }

    // Client is black
    else {
        black = true;
        document.title = 'Opponent\'s turn..';
    }

    //Send the board, it contains the squares, pieces locations, etc
    defaultBoard.inCheck = false;
    defaultBoard.doubleMove = false;
    defaultBoard.whiteKing = 'D1';
    defaultBoard.blackKing = 'E8';
    board = defaultBoard;
});

client.on('move', move => {
    implementMove(move);
});

client.on('gameOver', winner => {

});

client.on('message', msg => {

    let opponentColor = black ? 'white' : 'black';
    $('#messages').append($('<li>').text(`${opponentColor}: ${msg}`));
    scrollChatToBottom();
});

//Connects the client to the server via socket.io
function joinRoom() {

    document.title = `${document.location.href.substring(document.location.href.length - 6, document.location.href.length)}`;
    let matchURL = document.title.substring(document.title.indexOf('#') + 1, document.title.length);

    //Join the socket.io room
    client.emit('inMatch', matchURL, client.id);
}

//#endregion

//#region Chess Logic

//Returns an array of possible castle moves
// function pieceCanCastle(rookNotation, square) {

//     //Variables

//     let color = black ? 'black' : 'white';
//     let kingSquare = color == 'black' ? board[getSquareIndex(board.blackKing)] : board[getSquareIndex(board.whiteKing)];
//     if (kingSquare.piece == undefined || square.piece.moved) {
//         return true;
//     }

//     let kingNotation = kingSquare.notation;
//     let pieceRank = square.notation.substring(1, 2);
//     let rookFile = rookNotation.substring(0, 1);
//     let rookFileNumber = fileConverter('number', rookFile);
//     let kingFile = kingNotation.substring(0, 1);
//     let kingFileNumber = fileConverter('number', kingFile);


//     //The number of squares between the rook and the king
//     let distance = Math.abs(rookFileNumber - kingFileNumber) - 1;
//     //The first file to check
//     let squareFile = Math.min(rookFileNumber, kingFileNumber) + 1;

//     //Check each of the squares standing between them, all squares have the same rank(1 or 8), but different files
//     for (let i = 0; i < distance; i++) {

//         let squareNotation = fileConverter('file', squareFile) + pieceRank;
//         let squareIndex = getSquareIndex(squareNotation);

//         //If there is a piece between the king and the rook, stop checking, no castle allowed
//         if (board[squareIndex].piece) {
//             return false;
//         }

//         squareFile++;
//     }

//     //There aren't any pieces standing between the rook and the king, only condition to check is whether castling will put
//     //The king in danger (opponent piece can directly move towards the king)


//     let kingNewFile = fileConverter('file', Math.min(rookFileNumber, kingFileNumber) + 2);
//     if (kingNewFile > 8 || kingNewFile < 1) {
//         return true;
//     }

//     let kingNewPos = kingNewFile + pieceRank;
//     let newPosIndex = getSquareIndex(kingNewPos);


//     //Implement the castle on the board
//     board[newPosIndex].piece = kingSquare.piece;

//     //Delete the king's former position
//     delete kingSquare.piece;

//     //Calculate if an enemy piece will be able to target the king
//     //Loop through the boards squares and look for opponent pieces
//     for (let s = 0; s < board.length; s++) {

//         //Enemy piece
//         if (board[s].piece && board[s].piece.color != board[newPosIndex].piece.color) {

//             let notation = board[s].notation;
//             let opponentMoves = calculateMoves(notation, board);

//             //Loop through each possible move
//             for (let m = 0; m < opponentMoves.length; m++) {

//                 //If after moving, an enemy piece can target the king, castling isn't allowed
//                 if (opponentMoves[m] == kingNewPos) {
//                     kingSquare.piece = board[newPosIndex].piece;
//                     delete board[newPosIndex].piece;
//                     return false;
//                 }
//             }
//         }
//     }

//     //Revert the theoretical changes
//     kingSquare.piece = board[newPosIndex].piece;
//     delete board[newPosIndex].piece;

//     //Add the castle move to the moves array
//     return true;
// }

//Returns the square's index by giving it the square's notation
function getSquareIndex(notation) {

    //For memory optimization, check only max 8 squares instead of max 64 squares
    //That is possible due to board[0 ~ 7] represent rank 8, board[8~15] represent rank 7 and so on

    if (notation == undefined) {
        return -1;
    }

    let file = notation.substring(0, 1);
    let rank = notation.substring(1, 2);

    let i = (8 - rank) * 8;
    let stop = i + 8;

    for (; i < stop; i++) {

        //The square has the same rank and file, return it's array index
        let exists = board[i] != undefined;

        if (exists && board[i].notation.substring(0, 1) == file) {
            return i;
        }
    }

    return -1;
}

//calculateMoves -> deductPinMoves -> (if check) -> legalCheckMove
function getPossibleMoves(notation) {


    let pieceName = board[getSquareIndex(notation)].piece.name;
    let moves = calculateMoves(notation, board);

    moves = deductPinMoves(notation, moves);

    //Deduct illegal check moves
    if (board.inCheck || pieceName == 'king') {

        let movesClone = moves.slice(0);
        let from = notation;
        let kingSquare;

        if (turn) {

            kingSquare = black ? board.whiteKing : board.blackKing;
        }

        else {
            kingSquare = black ? board.blackKing : board.whiteKing;
        }

        //Loop through each move in the moves array and check if it is valid
        for (let i = 0; i < moves.length; i++) {

            let to = moves[i];
            let move = {
                from: from,
                to: to
            };


            //If the square is not legal
            if (!legalCheckMove(kingSquare, move)) {

                movesClone.splice(movesClone.indexOf(move.to), 1);
            }
        }

        //A clone is used to be able to splice the array while inside the loop
        moves = movesClone;
    }

    return moves;
}

//Returns an array of possible moves for the selected piece
function calculateMoves(notation, board) {

    //Variables
    let moves = [];
    let i = getSquareIndex(notation);
    let color = board[i].piece.color;
    let piece = board[i].piece;
    let pieceAlreadyMoved = board[i].piece.moved;
    let pieceFile = notation.substring(0, 1);
    let pieceRank = parseInt(notation.substring(1, 2));
    let pieceFileNumber = fileConverter('number', pieceFile);

    //Different pieces have different moves
    switch (piece.name) {

        //#region Pawn
        case 'pawn':

            let pawnDirection = color == 'white' ? 1 : -1; //White pawns move up the ranks, Black pawns move down

            let squareToCheck = `${pieceFile}${pieceRank + pawnDirection}`;
            let squareExists = getSquareIndex(squareToCheck) != -1;

            //If the square is empty, add it to possible moves array
            if (squareExists && !board[getSquareIndex(squareToCheck)].piece) {
                moves.push(squareToCheck);
            }

            //Pawn capture system:
            let diff = 1;

            //Iterate over the two squares the pawn is defending, and check if they're taken by an enemy piece
            for (let j = 0; j < 2; j++) {

                let file = fileConverter('file', pieceFileNumber + diff);
                diff *= -1;

                //If no such file exists, continue to the next iteration (i.e. A0)
                if (file == -1) {
                    continue;
                }

                let notation = file + (pieceRank + pawnDirection);

                //The index of the square we're checking
                let i = getSquareIndex(notation);
                let squareExists = i != -1;

                //If the square is taken by an enemy piece
                if (squareExists && board[i].piece && board[i].piece.color != color) {

                    //Add it to the moves array
                    moves.push(notation);
                }
            }
            break;
        //#endregion

        //#region Knight
        case 'knight':

            //First file to check
            let currFileNumber = pieceFileNumber - 2;

            //Check all four possible files
            for (let f = 0; f < 4; f++) {

                let currFile = fileConverter('file', currFileNumber);

                //Check The two possible squares for the given file
                for (let s = 0; s < 2; s++) {

                    let rankModifier;

                    //Second and third iterations - check ranks on (pieceRank + 2) and (pieceRank - 2) 
                    if (f == 1 || f == 2) {
                        rankModifier = 2;
                    }

                    //First and fourth iterations - check ranks on (pieceRank + 1) and (pieceRank - 1) 
                    else {
                        rankModifier = 1;
                    }

                    //If it is the first iteration
                    if (s % 2 == 0) {
                        rankModifier *= -1;
                    }

                    let notation = currFile + (pieceRank + rankModifier);

                    //If the square can be moved to(i.e. no ally piece on it)
                    if (squareIsMoveable(notation, board, color)) {

                        moves.push(notation);
                    }
                }

                //First and third iterations
                if (f % 2 == 0) {
                    currFileNumber += 1;
                }

                //Second iteration
                else {
                    currFileNumber += 2;
                }
            }
            break;
        //#endregion

        //#region Bishop
        case 'bishop':

            let bishopDirection = color == 'white' ? 1 : -1;

            for (let direction = 1; direction <= 5; direction++) {

                let currFile = pieceFileNumber;
                let currRank = pieceRank;

                switch (direction) {

                    //Up the files + up the ranks (diagonal topright)
                    case 1:
                        currFile += 1;
                        currRank += 1;
                        break;

                    //Up the files + down the ranks (diagonal bottomright)
                    case 2:
                        currFile += 1;
                        currRank -= 1;

                        break;

                    //Down the files + up the ranks (diagonal topleft)
                    case 3:
                        currFile -= 1;
                        currRank += 1;
                        break;

                    //Down the files + down the ranks (diagonal bottomleft)
                    case 4:
                        currFile -= 1;
                        currRank -= 1;
                        break;
                    case 5:
                        currRank += bishopDirection;
                        break;
                }

                //The square to check
                let notation = fileConverter('file', currFile) + currRank;

                //If the square is moveable, add it to the possible list of moves
                if (squareIsMoveable(notation, board, color)) {
                    moves.push(notation);
                }
            }

            break;
        //#endregion

        //#region Rook
        case 'rook':

            //Rooks can move in four different directions
            for (let direction = 1; direction <= 4; direction++) {

                let currFile = pieceFileNumber;
                let currRank = pieceRank;

                //Maximum travel distance is 7, check each of the squares
                for (let i = 1; i <= 7; i++) {

                    switch (direction) {

                        //Up the Files (left to right)
                        case 1:
                            currFile += 1;
                            break;

                        //Up the Ranks (bottom to top)
                        case 2:
                            currRank += 1;
                            break;

                        //Down the files (right to left)
                        case 3:
                            currFile -= 1;
                            break;

                        //Down the ranks (top to bottom)
                        case 4:
                            currRank -= 1;
                            break;
                    }

                    //The square to check
                    let notation = fileConverter('file', currFile) + currRank;

                    //If the square is moveable, add it to the possible list of moves
                    if (squareIsMoveable(notation, board, color)) {
                        moves.push(notation);

                        //If the square has an enemy piece on it, break - as it blocks movement
                        let i = getSquareIndex(notation);
                        if (board[i].piece) {
                            break;
                        }
                    }

                    //If the square is blocked by an ally piece or the square doesn't exist - break
                    else break;
                }
            }

            break;

        //#endregion

        // #region Queen

        case 'queen':
            for (let direction = 1; direction <= 4; direction++) {

                let currFile = pieceFileNumber;
                let currRank = pieceRank;

                switch (direction) {

                    //Up the files + up the ranks (diagonal topright)
                    case 1:
                        currFile += 1;
                        currRank += 1;
                        break;

                    //Up the files + down the ranks (diagonal bottomright)
                    case 2:
                        currFile += 1;
                        currRank -= 1;

                        break;

                    //Down the files + up the ranks (diagonal topleft)
                    case 3:
                        currFile -= 1;
                        currRank += 1;
                        break;

                    //Down the files + down the ranks (diagonal bottomleft)
                    case 4:
                        currFile -= 1;
                        currRank -= 1;
                        break;
                }

                //The square to check
                let notation = fileConverter('file', currFile) + currRank;

                //If the square is moveable, add it to the possible list of moves
                if (squareIsMoveable(notation, board, color)) {
                    moves.push(notation);
                }
            }

            break;


        //#endregion
        case 'promotion':
            for (let direction = 1; direction <= 4; direction++) {

                let currFile = pieceFileNumber;
                let currRank = pieceRank;

                switch (direction) {

                    //Up the files + up the ranks (diagonal topright)
                    case 1:
                        currFile += 1;
                        currRank += 1;
                        break;

                    //Up the files + down the ranks (diagonal bottomright)
                    case 2:
                        currFile += 1;
                        currRank -= 1;

                        break;

                    //Down the files + up the ranks (diagonal topleft)
                    case 3:
                        currFile -= 1;
                        currRank += 1;
                        break;

                    //Down the files + down the ranks (diagonal bottomleft)
                    case 4:
                        currFile -= 1;
                        currRank -= 1;
                        break;
                }

                //The square to check
                let notation = fileConverter('file', currFile) + currRank;

                //If the square is moveable, add it to the possible list of moves
                if (squareIsMoveable(notation, board, color)) {
                    moves.push(notation);
                }
            }

            break;
        //#region King

        case 'king':

            //The king can move in 8 different directions
            for (let direction = 1; direction <= 8; direction++) {

                let currFile = pieceFileNumber;
                let currRank = pieceRank;

                switch (direction) {

                    //Up the files(left to right)
                    case 1:
                        currFile += 1;
                        break;

                    //Down the files(right to left)
                    case 2:
                        currFile -= 1;
                        break;

                    //Up the ranks(bottom to top)
                    case 3:
                        currRank += 1;
                        break;

                    //Down the ranks(top to bottom)
                    case 4:
                        currRank -= 1;
                        break;

                    //Up the files + up the ranks (diagonal topright)
                    case 5:
                        currFile += 1;
                        currRank += 1;
                        break;

                    //Up the files + down the ranks (diagonal bottomright)
                    case 6:
                        currFile += 1;
                        currRank -= 1;

                        break;

                    //Down the files + up the ranks (diagonal topleft)
                    case 7:
                        currFile -= 1;
                        currRank += 1;
                        break;

                    //Down the files + down the ranks (diagonal bottomleft)
                    case 8:
                        currFile -= 1;
                        currRank -= 1;
                        break;
                }

                //The square to check
                let notation = fileConverter('file', currFile) + currRank;

                //If the square is moveable, add it to the possible list of moves
                if (squareIsMoveable(notation, board, color)) {
                    moves.push(notation);
                }
            }

            break;

        //#endregion
    }

    //#region Castle

    // //If the selected piece has already moved, castling isn't allowed
    // if  ((piece.name == 'rook' || piece.name ==  'king') && !pieceAlreadyMoved){

    //     switch (piece.name) {

    //         //A rook is selected
    //         case 'rook':
    //             let kingSquare = color == 'black' ? board[getSquareIndex(board.blackKing)] : board[getSquareIndex(board.whiteKing)];

    //             //If the king has moved, castling is not possible
    //             if (!kingSquare.piece || kingSquare.piece.moved){
    //                 break;
    //             }

    //             if (pieceCanCastle(board[getSquareIndex(notation)].notation, board[getSquareIndex(notation)])){
    //                 moves.push(kingSquare.notation);
    //             }

    //         break;

    //         //A king is selected
    //         case 'king':

    //             let rookFile = 'A';

    //             //Check if each of the rooks have moved
    //             for (let i = 0; i < 2; i++){

    //                 let rookSquare = board[getSquareIndex(`${rookFile}${pieceRank}`)];
    //                 if (rookSquare.piece && !rookSquare.piece.moved){

    //                     //If the king can castle with this specific pawn, add two moves 1)click on the rook itself, 2)move two squares towards
    //                     if (pieceCanCastle(rookSquare.notation, board[getSquareIndex(notation)])){
    //                         let rookFileNumber = fileConverter('number', rookFile);
    //                         let kingFile = notation.substring(0, 1);
    //                         let kingFileNumber = fileConverter('number', kingFile);
    //                         let emptySquareFile = fileConverter('file', Math.min(rookFileNumber, kingFileNumber) + 2);
    //                         let emptySquareNotation = emptySquareFile + pieceRank;
    //                         moves.push(rookSquare.notation, emptySquareNotation);
    //                     }
    //                 }

    //                 rookFile = 'H';
    //             }

    //         break;
    //     }
    // }

    //#endregion

    return moves;
}

//Returns a list of moves without moves that can leave the king undefended (the piece is pinned)
function deductPinMoves(piece, moves) {

    //Variables
    let pieceIndex = getSquareIndex(piece);
    let opponentColor = black ? 'white' : 'black';
    let pieceColor = board[pieceIndex].piece.color;
    let pieceName = board[pieceIndex].piece.name;
    let kingSquare;
    let movesClone = moves.slice(0);

    //Loop through the piece's moves
    outerloop:
    for (let i = 0; i < moves.length; i++) {

        //Variables
        kingSquare = black ? board.blackKing : board.whiteKing;
        let boardClone = getBoardClone(); //board's clone, used to avoid mutation
        let moveIndex = getSquareIndex(moves[i]);

        //Implement the move on the cloned board, and check if by moving the piece, the king might remain undefended

        //Delete the piece (if exists) from the move's destination
        delete boardClone[moveIndex].piece;

        //Add the selected piece:
        boardClone[moveIndex].piece = board[pieceIndex].piece;

        //Delete the piece from the former position
        delete boardClone[pieceIndex].piece;

        //If the piece is a king - update the 'kingSquare' property
        if (pieceName == 'king' && pieceColor != opponentColor) {
            kingSquare = moves[i];
        }

        //Loop through the boards squares and look for opponent pieces
        for (let s = 0; s < board.length; s++) {

            //Enemy piece
            if (boardClone[s].piece && boardClone[s].piece.color == opponentColor) {

                let notation = boardClone[s].notation;
                let opponentMoves = calculateMoves(notation, boardClone);

                //Loop through each possible move
                for (let m = 0; m < opponentMoves.length; m++) {

                    //If after moving, an enemy piece can target the king, delete the move from the array
                    if (opponentMoves[m] == kingSquare) {

                        //Remove the move, break and move on to the next move
                        movesClone.splice(movesClone.indexOf(moves[i]), 1);
                        continue outerloop;
                    }
                }
            }
        }
    }

    return movesClone;
}

//Calculate if the given move will stop the check
function legalCheckMove(kingSquare, move) {

    //Variables
    let clone = getBoardClone(); //to prevent mutation
    let fromIndex = getSquareIndex(move.from);
    let toIndex = getSquareIndex(move.to);
    let opponentColor = clone[fromIndex].piece.color == 'black' ? 'white' : 'black';
    let pieceName = clone[fromIndex].piece.name;

    //Move the piece to the new square
    clone[toIndex].piece = clone[fromIndex].piece;

    //Remove the piece from the former location
    delete clone[fromIndex].piece;

    //If moving the king, update the 'kingSquare' property
    if (pieceName == 'king') {

        kingSquare = clone[toIndex].notation;

        //White player
        if (opponentColor == 'black') {
            clone.whiteKing = clone[toIndex].notation;
        }

        //Black player
        else {
            clone.blackKing = clone[toIndex].notation;
        }
    }

    //Loop through squares on the board
    for (let i = 0; i < board.length; i++) {

        //If enemy piece
        if (clone[i].piece && clone[i].piece.color == opponentColor) {

            let notation = clone[i].notation;
            let moves = calculateMoves(notation, clone);

            //Loop through each possible move
            for (let m = 0; m < moves.length; m++) {

                //The move is illegal while in check, return false
                if (moves[m] == kingSquare) {
                    return false;
                }
            }
        }
    }

    //The move is legal while checked
    return true;
}

//#endregion

//#region Unit movement and Chat system

//After creating the board, call this function to add all the onClick listeners to them
function onClickPress() {

    //Click on a square
    $('td').on('click', (e) => {

        //If it's not your turn, return
        if (!turn) {
            return;
        }

        //If the square can legally be moved to
        if ($(e.target).hasClass('moveable')) {

            //The square's notation
            let notation = e.target.id;
            let move = {
                from: selectedPiece,
                to: notation
            };

            implementMove(move);
        }
    });

    //Click on a piece
    $('img').on('click', e => {

        //If it's not your turn - return
        if (!turn) {
            return;
        }

        let squareNotation = e.target.parentNode.id;
        let pieceColor = $(e.target).hasClass('black') ? 'black' : 'white';

        //Client's piece
        if (pieceColor == 'black' && black || pieceColor == 'white' && !black) {

            //Check for castle (if the king pressed on ally rook)
            if ($(e.target.parentNode).hasClass('moveable')) {

                let rank = squareNotation.substring(1, 2);
                let rookFile = squareNotation.substring(0, 1);
                let kingFile = selectedPiece.substring(0, 1);
                let rookFileNumber = fileConverter('number', rookFile);
                let kingFileNumber = fileConverter('number', kingFile);
                let diff = kingFileNumber - rookFileNumber;
                let newFile;

                //King moved from E to C
                if (diff > 0) {
                    newFile = 'C';
                }

                //King moved from E to G
                else {
                    newFile = 'G';
                }

                //Final king's destination
                let destination = newFile + rank;

                //The square's notation
                let move = {
                    from: selectedPiece,
                    to: destination
                };

                //Update the server
                implementMove(move);
                return;
            }

            //Select the clicked piece
            selectPiece(squareNotation, true);
        }

        //Opponent's piece
        else {

            //A bool that stores the information whether the square is clickable
            let moveableSquare = $(e.target.parentNode).hasClass('moveable');

            //If the square is moveable and there's a piece currently selected - capture it
            if (selectedPiece && moveableSquare) {

                //The square's notation
                let notation = e.target.parentNode.id;
                let move = {
                    from: selectedPiece,
                    to: notation
                };

                //Update the server
                implementMove(move);
            }
        }
    });

    //Chat
    $(document).on('keydown', e => {

        //Enter key is pressed and the input is focused
        if (e.which == 13 && $('#input').is(':focus')) {

            //Variables:
            let msg = $('#input').val();

            //Message isn't empty
            if (msg.replace(' ', '') != '') {
                client.emit('message', msg);
                let color = black ? 'black' : 'white';
                $('#messages').append($('<li>').text(`${color}: ${msg}`));
                $('#input').val('');
                scrollChatToBottom();
            }
        }
    });
}

//#endregion

//#region Piece selection

function selectPiece(notation, select) {

    //#region Aesthetics

    //Variables for easier reference
    let td = $(`#${notation}`);
    let lightSquared = td.hasClass('lightSquare') ? true : false;

    //Select a piece
    if (select) {

        //If trying to select a piece that is already selected - unselect it
        if (selectedPiece == notation) {
            selectPiece(selectedPiece, false);
            return;
        }

        //If there's already a selected piece - unselect the already selected piece before selecting the new one
        else if (selectedPiece != undefined) {
            selectPiece(selectedPiece, false);
        }

        if (!board.inCheck) {
            //It is a light squared piece
            if (lightSquared) {
                let darkerLight = 'rgb(125, 172, 73)';
                td.css('background', darkerLight);
            }

            //It is a dark squared piece
            else {
                let lighterDark = 'rgb(125, 172, 73)';
                td.css('background', lighterDark);
            }
        }
        else {
            if (lightSquared) {
                let darkerLight = 'rgb(255, 234, 115)';
                td.css('background', darkerLight);
            }

            //It is a dark squared piece
            else {
                let lighterDark = 'rgb(255, 234, 115)';
                td.css('background', lighterDark);
            }

        }

        selectedPiece = notation;
    }

    //Unselect a piece
    else {

        //It is light squared
        if (lightSquared) {
            let lightColor = 'rgb(230, 210, 94)';
            td.css('background', lightColor);
        }

        //It is dark squared
        else {
            let darkColor = 'rgb(230, 210, 94)';
            td.css('background', darkColor);
        }

        //Disable moveable squares
        $(`.moveable`).toggleClass('moveable', false);
        selectedPiece = undefined;
        return;
    }

    //#endregion

    //#region Get possible moves

    selectedPiece = notation;
    let possibleMoves = getPossibleMoves(notation);

    //Toggle each one of the possible moves to 'moveable'
    for (let i = 0; i < possibleMoves.length; i++) {
        $(`#${possibleMoves[i]}`).toggleClass('moveable', true);
    }

    //#endregion
}

//#endregion

//#region Move implementation

//This function is in charge of: 1)Images 2)Sounds 3)Update values 4)Check for checks & mates 5)Communicate with the server
//It is called after a move is executed
function implementMove(move) {

    //#region Variables    
    let formerIndex = getSquareIndex(move.from);
    let newIndex = getSquareIndex(move.to);
    let color = black ? 'black' : 'white';
    let pieceName = board[formerIndex].piece.name;
    let pieceColor = board[formerIndex].piece.color;
    let attackerColor = turn && black || !turn && !black ? 'black' : 'white';
    let img = $($(`#${move.from}`)[0].children[0]);
    let destination = $(`#${move.to}`)[0];
    let moveToEmptySquare = destination.children.length == 0;
    let disableDefaultSound = false;
    let formerFile = move.from.substring(0, 1);
    let newFile = move.to.substring(0, 1);
    let formerRank = move.from.substring(1, 2);
    let newRank = move.to.substring(1, 2);

    //#endregion

    //#region Update Values

    //Change the piece's 'moved' property to true
    board[formerIndex].piece.moved = true;

    //Toggle off selection effects
    selectPiece(selectedPiece, false);

    //Set the board as not checked, from the previous move
    board.inCheck = false;

    //Disable en passant opportunity if not used immediately
    delete board.doubleMove;

    //Remove the piece(if exists) from the destination square
    delete board[newIndex].piece;

    //Add the new piece to the destination square
    board[newIndex].piece = board[getSquareIndex(move.from)].piece;

    //Remove the piece from it's former position
    delete board[getSquareIndex(move.from)].piece;


    //#endregion

    //#region Handle special moves

    switch (pieceName) {

        //Pawns
        case 'pawn':

            if (newRank == 3 || newRank == 6) {
                //Get the proper promotion color
                if (!turn) {
                    queenColor = black ? 'white' : 'black';
                }
                img[0].src = `../images/pieces/${pieceColor}_pawnpromotion.png`;

                board[newIndex].piece.name = 'queen';
            }
            break;

        // case 'king':
        //     //White king
        //     if (pieceColor == 'white') {
        //         board.whiteKing = move.to;
        //     }

        //     //Black king
        //     else {
        //         board.blackKing = move.to;
        //     }

        //     //Check for castle
        //     let formerFileNumber = fileConverter('number', formerFile);
        //     let newFileNumber = fileConverter('number', newFile);
        //     let stepsTaken = Math.abs(newFileNumber - formerFileNumber);
        //     if (stepsTaken == 2) {

        //         let rookFormerFile;
        //         let rookNewFile;
        //         //Kings moves to C, rook moves to D
        //         if (newFile == 'C') {
        //             rookFormerFile = 'A';
        //             rookNewFile = 'D';
        //         }

        //         //King moves to G, rook moves to F
        //         else if (newFile == 'G') {
        //             rookFormerFile = 'H';
        //             rookNewFile = 'F';
        //         }

        //         let rookFormerNotation = rookFormerFile + newRank;
        //         let rookNewNotation = rookNewFile + newRank;

        //         let formerRookIndex = getSquareIndex(rookFormerNotation);
        //         let newRookIndex = getSquareIndex(rookNewNotation);

        //         //Add the rook's image to his new position
        //         let rookImg = $($(`#${rookFormerNotation}`)[0].children[0]);
        //         let destination = $($(`#${rookNewNotation}`)[0]);

        //         rookImg.appendTo(destination);

        //         //Add rook to the new position
        //         board[newRookIndex].piece = board[formerRookIndex].piece;

        //         //Remove from the former position
        //         delete board[formerRookIndex].piece;

        //     }
        //     break;
    }

    //#endregion

    //#region Visuals & Sounds

    //End turn
    if (turn) {

        //Change document's title
        document.title = 'Opponent\'s turn..';

        //Disable pointer cursor on piece hover
        $('.moveable').toggleClass('moveable', false);
        $('.clickable').toggleClass('clickable', false);
    }

    //Start turn
    else {

        //Change document's title
        document.title = 'Your turn!';

        //Set pieces pointer cursor for his own pieces on hover
        $(`.${color}`).toggleClass('clickable', true);
    }

    //On piece capture
    if (!moveToEmptySquare) {

        //Remove it's image
        destination.children[0].remove();

        //Play capture sound
        if (!disableDefaultSound) {
            captureSound.play();
        }
    }

    //On piece movement
    else if (!disableDefaultSound) {

        //Play piece movement sound
        moveSound.play();
    }

    //Update the piece image location
    img.appendTo($(destination));

    //#endregion

    //#region Checks and Checkmates

    //After a move is made, check whether a king is checked - scan all squares
    for (let s = 0; s < board.length; s++) {

        //If the square has a piece, and the piece's client just played the turn
        if (board[s].piece && board[s].piece.color == attackerColor) {

            //Get an array of possible moves
            let moves = calculateMoves(board[s].notation, board);

            //Loop through all moves and check if the king is checked
            for (let i = 0; i < moves.length; i++) {

                let index = getSquareIndex(moves[i]);

                if (board[index].piece && board[index].piece.name == 'king' && board[index].piece.color != attackerColor) {
                    board.inCheck = moves[i];
                    break;
                }
            }
        }
    }

    //If checked - mark king as checked and check for checkmate
    if (board.inCheck) {

        //Set red border
        let king = $(`#${board.inCheck}`);
        king.toggleClass('checked', true);

        //Loop through all board squares - check for checkmate
        for (let i = 0; i < board.length; i++) {

            if (board[i].piece && board[i].piece.color != attackerColor) {

                //Get possible moves for the piece, if there are possible moves, break
                let moves = getPossibleMoves(board[i].notation);
                if (moves.length > 0) {
                    break;
                }
            }

            //Last iteration and didn't break, checkmate
            if (i == 63) {
                $('#messages').append($('<li>').text(`Checkmate!`));
                scrollChatToBottom();
            }
        }
    }

    //Remove red border if exists
    else {
        $('.checked').toggleClass('checked', false);
    }
    //#endregion

    //Update server
    if (turn) {
        console.log(move);

        client.emit('move', move);
    }

    turn = !turn;
}

//#endregion
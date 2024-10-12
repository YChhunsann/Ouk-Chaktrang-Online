//#region Classes

//Square
class Square{
    constructor(position, td, piece){
        this.position = position;
        this.td = td;
        this.piece = piece;
        this.moveable = false;
    }
}

//Position
class Position{
    constructor(file, rank, specialMove){
        this.file = file;
        this.rank = rank;
        this.specialMove = specialMove;
        this.position = file+rank;
    }
}

//Piece
class Piece{
    constructor(name, color, position){
        this.name = name;
        this.color = color;
        this.position = position;
        this.selected = false;
        this.moves = [];
        this.moved = false;
    }
}

//Move class, used to transfer moves between clients and the server
class Move{
    constructor(from, to, specialMove){
        this.from = from;
        this.to = to;
        this.specialMove = specialMove;
    }
}

//#endregion

//#region Variables

const client = io();
const board = [];
const pieces = [];
let selectedPiece, lastEnemyMove;
let black = false;
let specialMoveMade;
let pawnDirection = 1;
main();

//#endregion

//#region Board Initialization

//Rotates the board 180deg (to play black side)
function playAsBlack(){
    black = true;
    pawnDirection = -1;
    document.title = 'Opponent\'s turn';
    $('#board').toggleClass('rotated');
    $('img').toggleClass('rotated');
}

//Build the chess board
function buildBoard(){
    let table = $('#board');
    for(let r = 0; r < 8; r++){
        table.append(`<tr id=\'r${r}\'></tr>`);
        for(let c = 0; c < 8; c++){
            $(`#r${r}`).append(`<td id=\'td${r}_${c}\'> </td>`);
            addSquareToArray(r, c, $(`#td${r}_${c}`));
            if (r % 2 == 0){
                if (c % 2 == 0){
                    color = 'rgb(253,234,182)';
                }
                else{
                    color = 'rgb(198, 161, 118)';
                }
            }

            else{
                if (c % 2 == 0){
                    color = 'rgb(198, 161, 118)';
                }
                else{
                    color = 'rgb(253,234,182)';
                }
            }
            //Change the square's color based on modulus
            $(`#td${r}_${c}`).css('background', color);
        }
    }
}

//Add each square to the [board] array, and set a file and rank for each one
function addSquareToArray(r, c, td){
    let file, rank;
    switch (c){
        case 0:
        file = 'A';
        break;
        case 1:
        file = 'B';
        break;
        case 2:
        file = 'C';
        break;
        case 3:
        file = 'D';
        break;
        case 4:
        file = 'E';
        break;
        case 5:
        file = 'F';
        break;
        case 6:
        file = 'G';
        break;
        case 7:
        file = 'H';
        break;
    }

    switch (r){
        case 0:
        rank = 8;
        break;
        case 1:
        rank = 7;
        break;
        case 2:
        rank = 6;
        break;
        case 3:
        rank = 5;
        break;
        case 4:
        rank = 4;
        break;
        case 5:
        rank = 3;
        break;
        case 6:
        rank = 2;
        break;
        case 7:
        rank = 1;
        break;
    }
    board.push(new Square(new Position(file, rank), td[0]));
}

//Add white and black pieces to the board
function addPieces(){
    
    //Helper method to quickly add a piece to a desire square
    function initializeSquare(color, piece, i){        
        let sq = $(board[i].td)[0];
        
        board[i].piece = new Piece(piece, color);
        $(sq).append(`<img class=\'${color}\' src=\'../images/pieces/${color}_${piece}.png\'>`);
    }

    for(let i = 0; i < board.length; i++){

        //Assign a property of square for each square, for easier reference
        board[i].td.square = board[i];

        //Squares with pieces
        if (board[i].position.rank == 1 || board[i].position.rank == 2 || board[i].position.rank == 7 || board[i].position.rank == 8){

            //Rank 1 - White pieces
            if (board[i].position.rank == 1){
                //Rooks
                if(board[i].position.file == 'A' || board[i].position.file == 'H'){
                    initializeSquare('white', 'rook', i);
                }
                //Knights
                else if(board[i].position.file == 'B' || board[i].position.file == 'G'){
                    initializeSquare('white', 'knight', i);
                }
                //Bishops
                else if(board[i].position.file == 'C' || board[i].position.file == 'F'){
                    initializeSquare('white', 'bishop', i);
                }
                //Queen
                else if(board[i].position.file == 'D'){
                    initializeSquare('white', 'queen', i);
                }
                //King
                else{
                    initializeSquare('white', 'king', i);
                }
            }

            //Rank 8 - Black pieces
            else if (board[i].position.rank == 8){
                //Rooks
                if(board[i].position.file == 'A' || board[i].position.file == 'H'){
                    initializeSquare('black', 'rook', i);
                }
                //Knights
                else if(board[i].position.file == 'B' || board[i].position.file == 'G'){
                    initializeSquare('black', 'knight', i);
                }
                //Bishops
                else if(board[i].position.file == 'C' || board[i].position.file == 'F'){
                    initializeSquare('black', 'bishop', i);
                }
                //Queen
                else if(board[i].position.file == 'D'){
                    initializeSquare('black', 'queen', i);
                }
                //King
                else{
                    initializeSquare('black', 'king', i);
                }
            }

            //Pawns
            else{

                if (board[i].position.rank == 2){
                    initializeSquare('white', 'pawn', i);
                }
                else if (board[i].position.rank == 7){
                    let sq = $(board[i].td);
                    initializeSquare('black', 'pawn', i);
                }
            }

            //Pipe position information to the piece object
            board[i].piece.position = new Position(board[i].position.file, board[i].position.rank);
            
            if (board[i].piece.color == client.side){
                pieces.push(board[i].piece);
            }
        }
    }

    //Send the board object to the server
    if (!black)
        sendBoard();
    
}

//#endregion

//#region Movement

//Movement logic - marks all possible moves
function availableMoves(piece){
    //Variables
    let currFile = piece.position.file;
    let currFileNumber = parseInt(fileConverter('toNumber', currFile)); // (H -> 8, A -> 1, etc.)
    let currRank = piece.position.rank;
    let moves = [];
    piece.moves = [];

    

    let movementType; // Vertical, horizontal, diagonal, a mixture, or knight

    //Calculates if there is a piece at the desired position or on the way there
    function squareIsTakenOrBlocked(desiredPosition, direction){
        switch (direction){

            //Moving vertically only - Pawns
            case 'v':
                if (piece.position.file == desiredPosition.file){
                
                    let distance = Math.abs(currRank - desiredPosition.rank);
                    let nextRank = currRank + pawnDirection;
        
                    //Scan each rank along the way to the desired position
                    for (let i = 0; i < distance; i++){
        
                        if (positionToSquare(new Position(currFile, nextRank)).piece != undefined){
                            return true;
                        }
        
                        //Scan the next rank, if white 1->2->3, if black 8->7->6
                        nextRank += pawnDirection;
                    }
        
                }
            break;

            //Moving vertically and horizontally - Rooks
            case 'vh':

            break;

        }
        return false;
    }    

    switch(piece.name){

        //Pawn movement
        case 'pawn':
            movementType = 'v'; //(vertical movement)

            //The pawn hasn't moved yet - allow double move:
            if (!piece.moved){
                let m = new Position(currFile, currRank + (2 * pawnDirection));
                let m2 = new Position(currFile, currRank + (1 * pawnDirection));
                
                let mTaken;
                //Is the square taken? if it isn't, add it to the legal moves array:
                squareIsTakenOrBlocked(m, movementType)? mTaken = true : moves.push(m, m2);

                if (mTaken){
                    squareIsTakenOrBlocked(m2, movementType)? null : moves.push(m2);
                }
            }

            //The pawn has already moved:
            else{
                let m = new Position(currFile, currRank + (1 * pawnDirection));
                squareIsTakenOrBlocked(m, movementType)? null : moves.push(m);

                //#region En passant

                //Check if the pawn is in the proper rank for en passant:
                if ((client.side == 'white' && currRank == 5) || (client.side == 'black' && currRank == 4)){

                    //Check if the last enemy move was a pawn move and he's in the proper files(one to the left or one to the right):
                    if (positionToSquare(lastEnemyMove.to).piece.name == 'pawn' && (lastEnemyMove.to.file == fileConverter('toFile', currFileNumber - 1) || lastEnemyMove.to.file == fileConverter('toFile', currFileNumber + 1))){

                        //Check if the pawn just double moved:
                        if (Math.abs(lastEnemyMove.from.rank - lastEnemyMove.to.rank == 2)){

                            //Add En passant to moves array:
                            moves.push(new Position(lastEnemyMove.from.file, lastEnemyMove.to.rank + pawnDirection, 'enPassant'));                            
                        }
                    }
                }

                //#endregion
            }

            //Pawn capture system
            let index = 1;
            for (let i = 0; i < 2; i++){
                let sq = positionToSquare(new Position(fileConverter('toFile', currFileNumber + index), currRank + pawnDirection));
                if (sq == undefined)
                    continue;
                if (sq.piece != undefined && sq.piece.color != client.side){
                    moves.push(sq.position);
                }
                index *= -1;
            }
        break;

        case 'rook':
            movementType = 'vh'; //(vertical & horizontal movement)
        break;
    }
    return moves;
}

//Move a piece from one square to another
function movePiece(destinationSquare){

    //Move sent to the server
    let move = new Move(selectedPiece.position, destinationSquare.position, specialMoveMade);
    specialMoveMade = undefined;

    //Check if the client just captured a piece
    if (destinationSquare.piece != undefined){
        destinationSquare.td.children[0].remove();
    }

    //Remove piece image and add it to the desired destinationSquare
    $(selectedPiece.square.children[0]).appendTo($(destinationSquare.td));
    selectedPiece.square.piece = undefined;
    selectedPiece.moved = true;
    destinationSquare.piece = selectedPiece;
    selectedPiece.position = destinationSquare.position;
    selectPiece(selectedPiece, false);

    //Switch turns
    turnManager(false, move);
}

//Select or unselect a piece and add selection effects
function selectPiece(piece, select, square){

    //Toggle the available moves border & logic for a piece when selected/unselected
    function legalMovesEffects(state){

        for(let i = 0; i < selectedPiece.moves.length; i++){
            let sq = positionToSquare(selectedPiece.moves[i]);
            sq.moveable = state? true : false;
            $(sq.td).toggleClass('moveable', state ? true : false);
            $(sq.td).toggleClass('clickable', state ? true : false);
        }
    }

    //Select the piece
    if (select){
        piece.selected = true;
        selectedPiece = piece;
        selectedPiece.square = square.td;
        $(square.td).toggleClass('selected', true);
        legalMovesEffects(true);
    }

    //Unselecet the piece
    else{
        $(selectedPiece.square).toggleClass('selected', false);
        piece.selected = false;
        legalMovesEffects(false);
        selectedPiece = undefined;
    }
}

//#endregion

//#region Chat

//Chat system
$(document).on('keypress', e => {
    if (e.which == 13 && $('#input').is(':focus') && $('#input').val() != ''){
        $('#messages').append(`<li>${$('#input').val()}</li>`);
        $('#input').val('');
    }
});

//#endregion

//#region Client & Server

//Turn manager
function turnManager(state, move){
    let title;

    //Start turn
    if (state){
        client.turn = true;
        title = 'Your turn!';
    }

    //End turn
    else{
        $(`img`).toggleClass('clickable', false);
        client.turn = false;
        title = 'Opponent\'s turn..';
        client.emit('endturn', move);
        console.log(client.id);
        
    }

    document.title = title;
}

//Implement opponent's last turn in client's board
function updateBoard(move){

    lastEnemyMove = move;

    //If a piece was captured, remove the piece from the board:
    if (positionToSquare(move.to).piece){
        removePiece(move.to);
    }

    //Move the needed piece:
    positionToSquare(move.to).piece = positionToSquare(move.from).piece;
    positionToSquare(move.to).piece.position = move.to;


    //Remove the piece from the former position and add it to the new position:
    $(positionToSquare(move.from).td.children[0]).appendTo($(positionToSquare(move.to).td));
    positionToSquare(move.from).piece = undefined;

    //Check for special moves:
    if (move.specialMove != undefined){
        switch(move.specialMove){

            //The opponent has just made en passant
            case 'enPassant':
            
                //Remove the piece from the board                
                removePiece(new Position(lastEnemyMove.to.file, lastEnemyMove.to.rank + pawnDirection));
            break;

            case 'castle': //This will take a while to reach :)
            break;

            case 'promotion':
            break;
        }
    }
}

//Assign sides
client.on('color', blackID => {

    //Assign the client as white
    if (client.id != blackID){
        client.side = 'white';
        turnManager(true);
    }

    else{
        client.turn = false;
        client.side = 'black';
    }

    buildBoard();
    onSquareClick();
    addPieces();
    //If white, don't populate moves yet, wait for end of turn:
    if (client.id != blackID){
        calculateLegalMoves();
    }

    //Flip the board 180degs
    if (client.id == blackID){
        playAsBlack();
    }
});

//Handle opponent's end of turn, now it's the client's turn:
client.on('endturn', move => {

    updateBoard(move);
    calculateLegalMoves();
    turnManager(true);
});

//#endregion

//#region Helper methods

//Sends the created board to the server
function sendBoard(){
    const serverBoard = board.map((square) => {
        return square.position.position;
        
    });
    console.log(serverBoard);
    
    //client.emit('board', serverBoard);
}

//Removes a piece from the board:
function removePiece(position){

    //Position to square:
    let square = positionToSquare(position);
    square.piece = undefined;

    //Remove the piece from 'pieces' array:
    pieces.splice(pieces.indexOf(square.piece), 1);

    //Remove the piece from the board:
    square.td.children[0].remove();
}

//Converts files to numbers and numbers to files
function fileConverter(mode, arg){

    //Conver a number to file, i.e. 1 -> A, H -> 8
    if (mode == 'toFile'){
        switch(arg){
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
    else if (mode == 'toNumber'){
        switch(arg){
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
}

//This function is basically controlling the function 'availableMoves'
//Loop through all pieces and get legal moves, if there are, make the piece clickable and selectable:
function calculateLegalMoves(){
    
    for (let i = 0; i < pieces.length; i++){
        pieces[i].moves = availableMoves(pieces[i]);

        //If the piece has legal moves - toggle clickable effect:
        if (pieces[i].moves.length > 0){
            $(positionToSquare(pieces[i].position).td.children[0]).toggleClass('clickable', true);
        }
    }
}

//Receive a position(file and rank) and return the proper square from the board array
function positionToSquare(pos){
    for(let i = 0; i < board.length; i++){
        if (board[i].position.file != pos.file)
            continue;
        if (board[i].position.rank != pos.rank)
            continue;

        //Return the requested suqare
        return board[i];
    }
}

//Main method
function main(){

    //Site title and match ID
    document.title = `${document.location.href.substring(document.location.href.length - 6, document.location.href.length).toUpperCase()}`;
    let matchID = document.title.substring(document.title.indexOf('#') + 1, document.title.length);

    //Join the socket.io room
    client.emit('join', matchID);
}

//#endregion

//#region onClick

function onSquareClick(){
    $('td').on('click', (e) => {

        //If it's not your turn, return
        if (!client.turn)
        return;

        //Clicked on a piece
        if (e.target.nodeName == 'IMG'){

            let square = e.target.parentNode.square;
            let piece = square.piece;

            //The piece is mine
            if(piece.color == client.side){
                
                //Check if there are any moves for the piece
                if (piece.moves.length == 0)
                    return;

                //The piece is already selected - Unselect it
                if(piece.selected){
                    selectPiece(piece, false, square);                    
                }

                //The piece is not selected - Select it 
                else{
                    //If another piece is already selected, unselect it
                    if (selectedPiece != undefined){
                        selectPiece(selectedPiece, false, selectedPiece.square);
                    }
                    selectPiece(piece, true, square);                    
                }
            }

            //Enemy's piece
            else{
                //Check whether there is a piece selected
                if (!selectedPiece){
                    return;
                }
                //Check if the client can capture
                //(if the square that was clicked is inside the selected piece moves array)
                for (let i = 0; i < selectedPiece.moves.length; i++){

                    if (selectedPiece.moves[i].file == square.position.file && selectedPiece.moves[i].rank == square.position.rank){
                        movePiece(square);
                        break;
                    }
                }            
            }
        }

        //Clicked on a square
        else if (e.target.nodeName == 'TD'){
            let sq = e.target.square;

            //If a piece is selected and a proper square was clicked, move to it
            if (selectedPiece && sq.moveable){

                //Check for en passant trigger:
                if (selectedPiece.name == 'pawn'){

                    //Execute En Passant:
                    for (let i = 0; i < selectedPiece.moves.length; i++){
                        if (selectedPiece.moves[i].specialMove == 'enPassant' && selectedPiece.moves[i].file == sq.position.file && selectedPiece.moves[i].rank == sq.position.rank){
                            removePiece(new Position(lastEnemyMove.to.file, lastEnemyMove.to.rank));
                            specialMoveMade = 'enPassant';
                            break;
                        }
                    }
                }
                movePiece(sq);
            }
        }
    });
}

//#endregion
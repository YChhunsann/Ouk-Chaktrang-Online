//#region Requires
const express = require('express');
const app = express();
const http = require('http').Server(app);
const server = require('socket.io')(http);
const fs = require('fs');
//#endregion

//#region Global server variables

const defaultBoard = getInitialBoard();
const rooms = [];
const matches = [];

//#endregion

//#region Server handlers

server.on('connection', client => {

    //Once a client connects, send him the current list of rooms
    server.to(client.id).emit('updateRooms', rooms);

    //#region Lobby

    //Create a room
    client.on('createRoom', room => {
        room.matchID = client.id;
        rooms.push(room);
        server.emit('updateRooms', rooms);
    });

    //Delete a room
    client.on('deleteRoom', () => {
        for(let i = 0; i < rooms.length; i++){
            if (rooms[i].matchID == client.id){
                rooms.splice(rooms.indexOf(client), 1);
                server.emit('updateRooms', rooms);
                return;
            }
        }
    });

    //If the client disconnects after creating a room, delete the room
    client.on('disconnect', () => {
        for (let i = 0; i < rooms.length; i++){
            if (rooms[i].matchID == client.id){
                rooms.splice(rooms.indexOf(client), 1);
                server.emit('updateRooms', rooms);
                break;
            }
        }

        //Check if the client is in a game, if he is, end the game
    });

    //#endregion

    //#region Game Creation

    client.on('joinRoom', matchID => {
    
        //If the client already had a room, delete that
        for (let i = 0; i < rooms.length; i++){
            if (rooms[i].matchID == client.id){
                rooms.splice(rooms.indexOf(client), 1);
                server.emit('updateRooms', rooms);
            }
        }

        //Add the client to the socket.io room
        client.join(matchID);

        //Create the webpage
        let matchURL = matchID.substring(0, 6);
        addPage(matchURL);
    
        //Send the clients to the game
        server.to(matchID).emit('joinMatch', matchURL);
    });

    //The client is inside the match
    client.on('inMatch', matchID => {

        //Add each one of the players into the 'socket.server' room
        client.join(matchID);
        client.matchID = matchID;
        let black = true;
        
        if (matches.indexOf(matchID) == -1){
            matches.push(matchID);
            black = false;
        }
        server.to(client.id).emit('assignSides', black, defaultBoard);
    });

    //#endregion

    //#region In-game

    //Send the move to the other client
    client.on('move', move => {

        client.to(client.matchID).broadcast.emit('move', move);
    });

    //Chat system
    client.on('message', msg => {
        client.to(client.matchID).broadcast.emit('message', msg);
    });

    //#endregion
});

//#endregion

//#region Helper methods

//Gets the initial board information from a JSON file, it includes all the square notations and the location of all pieces:
function getInitialBoard(){
    return JSON.parse(fs.readFileSync(__dirname+'/board.json', 'utf8'));
}

//#endregion

//#region Http & Handle new games

function addPage(matchID){
    app.get(`/${matchID}`, (req, res) => {
        res.sendFile(__dirname + '/public/match.html');
    });
}

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

http.listen(process.env.PORT || 3000);

//#endregion
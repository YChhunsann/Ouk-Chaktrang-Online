//#region Variables
const client = io();
let roomCreated = false;

//#endregion

//#region Events handler

$('#btn_createRoom').on('click', onCreateRoom);
$('#btn_cancel').on('click', cancelRoomCreation);
$('#btn_create').on('click', createRoom);
$(document).on('keypress', e => {
    if (e.which == 13){
        $('#btn_create').click();
    }
});

//#endregion

//#region Create a room

//'Create Room' on click [Creates a room or deletes a created one]
function onCreateRoom(){

    //Create a room
    if (roomCreated == false){

        //Disable the create room button
        $('#btn_createRoom').prop('disabled', 'disabled');

        //Display the div
        $('#create-room-container').css('display', 'flex');

        //Focus on the name input
        $('#input_roomName').focus();
    }

    //Delete the created room
    else{
        roomCreated = false;
        $('#btn_createRoom').text(`Create a Room`);
        client.emit('deleteRoom');
    }
}

//Click the 'cancel' button while creating a room, simply return to the main menu
function cancelRoomCreation(){
    //Enable the create room button
    $('#btn_createRoom').prop('disabled', false);

    //Display the div
    $('#create-room-container').css('display', 'none');
}

//Finalize the room creation
function createRoom(){
    let roomName = $('#input_roomName').val();
    $('#input_roomName').val('');

    let room = {
        name: roomName == '' ? 'unnamed' : roomName
    };

    roomCreated = true;
    $('#btn_createRoom').text(`Delete '${roomName}'`);
    $('#btn_createRoom').prop('disabled', false);
    $('#create-room-container').css('display', 'none');
    client.emit('createRoom', room);
}

//#endregion

//#region Server communication

//Update the rooms list
client.on('updateRooms', rooms => {

    $('#rooms').empty();
    for(let i = 0; i < rooms.length; i++){
        $('#rooms').append(`<li value='${rooms[i].matchID}'>Room: ${rooms[i].name}</li>`);
        console.log('matchid: ' + rooms[i].matchID);
        console.log('clientid: ' + client.id);
        
    }

    //Room on click
    $('li').on('click', e => {
        let matchID = e.target.getAttribute('value');
        
        //If the user enters a room he hasn't created himself
        if (matchID != client.id){
            client.emit('joinRoom', matchID);
        }
    });
});

client.on('joinMatch', matchURL => {
    window.location.href = window.location.href + matchURL;
});

//#endregion
//#region Variables
const client = io();
let roomCreated = false;

//#endregion

//#region Events handler

$('#btn_createRoom').on('click', onCreateRoom);
$('#btn_cancel').on('click', cancelRoomCreation);
$('#btn_create').on('click', createRoom);
$(document).on('keypress', e => {
    if (e.which == 13) {
        $('#btn_create').click();
    }
});

//#endregion

//#region Create a room

function onCreateRoom() {
    if (!roomCreated) {
        $('#btn_createRoom').prop('disabled', 'disabled');
        $('#create-room-container').css('display', 'flex');
        $('#input_roomName').focus();
    } else {
        roomCreated = false;
        $('#btn_createRoom').text('Create a Room');
        client.emit('deleteRoom');
    }
}

function cancelRoomCreation() {
    $('#btn_createRoom').prop('disabled', false);
    $('#create-room-container').css('display', 'none');
}

function createRoom() {
    let roomName = $('#input_roomName').val();
    $('#input_roomName').val('');

    let room = {
        name: roomName === '' ? 'unnamed' : roomName
    };

    roomCreated = true;
    $('#btn_createRoom').text(`Delete '${room.name}'`);
    $('#btn_createRoom').prop('disabled', false);
    $('#create-room-container').css('display', 'none');
    client.emit('createRoom', room);
}

//#endregion

//#region Server communication

client.on('updateRooms', rooms => {
    $('#rooms').empty();
    rooms.forEach(room => {
        $('#rooms').append(`<li value="${room.matchID}">Room: ${room.name}</li>`);
    });

    $('li').on('click', e => {
        let matchID = e.target.getAttribute('value');
        if (matchID !== client.id) {
            client.emit('joinRoom', matchID);
        }
    });
});

client.on('joinMatch', matchURL => {
    window.location.href = window.location.href + matchURL;
});

//#endregion

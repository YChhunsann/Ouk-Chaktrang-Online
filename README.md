## Chess

![gameplay](https://i.imgur.com/5DeoKtF.gif)

Made using socket.io & express

The general client-server workflow:

-Two clients get in a room(using socket.io websockets), one gets control over the board(the white player), if the user clicks on one of the white pieces, he will call 'calculateMoves' that will return an array with possible moves, the possible squares will have clickable borders, if he clicks one of the possible moves squares, he will execute the move, thus calling 'implementMove'.

-'implementMove' takes a 'move' object argument, that contains 'move.from'(the piece's origin) and 'move.to'(the piece's destination),
the function deals with the following: 1)move,add and delete images around the board 2)manage sounds 3)change values 4)check for checks and checkmates 5)communicate to the server that the client had just moved, send the 'move' object as well

-The server will receive the 'move' object and emit it back to the other client, also giving him control over the board, and the loop continues

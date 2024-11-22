const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 5000 });

let rooms = {};  
let users = new Map();  

server.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'newUser':
                
                if (!Array.from(users.values()).includes(data.username)) {
                    users.set(ws, data.username); 
                    console.log(`User ${data.username} connected.`);
                  
                    broadcastUser(data.username + ' has joined the chat.');
                } else {
                   
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Username already taken. Please choose a different one.'
                    }));
                }
                break;

            case 'createRoom':
                if (!rooms[data.room]) {
                    rooms[data.room] = [];
                    broadcastRooms();
                    console.log(`Room ${data.room} created!`);
                }
                break;

            case 'joinRoom':
                if (rooms[data.room]) {
                    ws.room = data.room; 
                    rooms[data.room].push(ws);
                    console.log(`${users.get(ws)} joined room ${data.room}`);
                    broadcastUser(`${users.get(ws)} has joined the room ${data.room}`);
                }
                break;

            case 'message':
                const room = ws.room;
                if (room && rooms[room]) {
                    const senderUsername = users.get(ws);

                    
                    rooms[room].forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'message',
                                username: senderUsername,  
                                text: data.text,
                                timestamp: new Date().toLocaleTimeString(),
                                room: room
                            }));
                        }
                    });
                }
                break;

            case 'leaveRoom':
                if (rooms[ws.room]) {
                    rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
                    console.log(`${users.get(ws)} left the room`);
                    broadcastUser(`${users.get(ws)} has left the room ${ws.room}`);
                }
                break;
        }
    });

    ws.on('close', () => {
        if (rooms[ws.room]) {
            rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
        }
        console.log(`User ${users.get(ws)} disconnected.`);
        users.delete(ws);  
    });

    
    function broadcastUser(message) {
        rooms[ws.room]?.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'userNotification',
                    message: message
                }));
            }
        });
    }

    
    function broadcastRooms() {
        const roomNames = Object.keys(rooms);
        server.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'roomList',
                    rooms: roomNames
                }));
            }
        });
    }
});

console.log('WebSocket server is running on ws://localhost:5000');
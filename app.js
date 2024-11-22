let ws;
let username;
let currentRoom = null;

document.addEventListener('DOMContentLoaded', () => {
    const roomsList = document.getElementById('rooms');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const chatMessages = document.getElementById('chatMessages');
    const roomNameHeader = document.getElementById('roomName');

    
    username = prompt("Enter your username:");
    ws = new WebSocket('ws://localhost:5000'); // Port 5000


    
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'newUser',
            username: username
        }));
        console.log(`Username: ${username} connected.`);
    };

    
    sendBtn.addEventListener('click', sendMessage);
    createRoomBtn.addEventListener('click', createRoom);
    leaveRoomBtn.addEventListener('click', leaveRoom);

    
    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);

        
        if (message.type === 'message' && message.room === currentRoom) {
            displayMessage(message);
        } else if (message.type === 'userNotification') {
            displayNotification(message.message);
        } else if (message.type === 'error') {
            alert(message.message);  
        }

        if (message.type === 'roomList') {
            updateRoomsList(message.rooms);
        }
    };

    
    function createRoom() {
        const roomName = prompt("Enter room name:");
        if (roomName.trim() !== "") {
            ws.send(JSON.stringify({
                type: 'createRoom',
                room: roomName
            }));
        }
    }

    
    function joinRoom(roomName) {
        currentRoom = roomName;
        ws.send(JSON.stringify({
            type: 'joinRoom',
            room: roomName
        }));
        roomNameHeader.textContent = `Room: ${roomName}`;
        chatMessages.innerHTML = '';  
        messageInput.disabled = false;
        sendBtn.disabled = false;
        leaveRoomBtn.disabled = false;
    }

   
    function leaveRoom() {
        ws.send(JSON.stringify({
            type: 'leaveRoom',
            room: currentRoom
        }));
        currentRoom = null;
        roomNameHeader.textContent = "Select a room to chat";
        chatMessages.innerHTML = '';  
        messageInput.disabled = true;
        sendBtn.disabled = true;
        leaveRoomBtn.disabled = true;
    }

    
    function sendMessage() {
        const message = messageInput.value;
        if (message.trim() !== "" && currentRoom) {
            ws.send(JSON.stringify({
                type: 'message',
                text: message,
                room: currentRoom
            }));
            messageInput.value = "";
        }
    }

    
    function displayMessage({ username, text, timestamp }) {
        if (!username || !text) return;  
        const messageElem = document.createElement('div');
        messageElem.className = 'message';
        messageElem.innerHTML = `<strong>${username}:</strong> ${text} <small>${timestamp || new Date().toLocaleTimeString()}</small>`;
        chatMessages.appendChild(messageElem);
        chatMessages.scrollTop = chatMessages.scrollHeight;  
    }

    
    function displayNotification(message) {
        const notificationElem = document.createElement('div');
        notificationElem.className = 'notification';
        notificationElem.textContent = message;
        chatMessages.appendChild(notificationElem);
        chatMessages.scrollTop = chatMessages.scrollHeight;  e
    }

    
    function updateRoomsList(rooms) {
        roomsList.innerHTML = '';  

        rooms.forEach(room => {
            const roomElem = document.createElement('li');
            roomElem.textContent = room;
            roomElem.addEventListener('click', () => {
                joinRoom(room);
            });
            roomsList.appendChild(roomElem);
        });
    }
});
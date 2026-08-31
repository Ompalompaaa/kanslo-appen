const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('publick'));

//håll koll på asnvändare 
const users = {};
// spara dagskänslkor: { namn: {color, feeling, date} }
const dailyFeelings = {};

io.on('connection', (socket) => {
console.log('någon anslöt:', socket.id);

socket.on('set-name', (name) => {
users[socket.id] = name;
// skicka listan med online användare
io.emit('users-update', Object.values(users));

// skicka den andres dagskänsla om den finns
const otherName = Object.values(users).find(u => u !== name);
if (otherName && dailyFeelings[otherName]) {
socket.emit('daily-feeling-update', {
name: otherName,
...dailyFeelings[otherName]
});
}
});

// ===== DAGSKOLLEN =====
socket.on('daily-feeling', (data) => {
const name = users[socket.id];
if (!name) return;

dailyFeelings[name] = {
color: data.color,
feeling: data.feeling,
date: data.date || new Date().toISOString().split('T')[0]
};

// Skicka till alla ANDRA (så den andra får uppdaterinen direkt)
socket.broadcast.emit('daily-feeling-update', {
name,
...dailyFeelings[name]
});
});

// ===== FÄRGBUBBLOR (realtid) =====
socket.on('color-feeling', (data) => {
socket.broadcast.emit('color-feeling', {
name: users[socket.id] || 'Någon',
color: data.color,
feeling: data.feeling
});
});

// ===== GULLIGA MEDDELANDEN =====
socket.on('sweet-message', (msg) => {
socket.broadcast.emit('sweet-message', {
name: users[socket.id] || 'Någon',
text: msg
});
});

socket.on('pepp-click', () => {
console.log(`${users[socket.id] || 'Någon'} öppnade pepp-burken`);
});

socket.on('disconnect', () => {
delete users[socket.id];
io.emit('users-update', Object.values(users));
console.log('någon lämnade');
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Känslo-appen körs på http://localhost:${PORT}`);
});
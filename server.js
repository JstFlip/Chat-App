/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config()

const SERVER_PORT = process.env.PORT || 8080

const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const helmet = require('helmet')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// Current users on website
const users = []
// Additional data
let username
let room

// eslint-disable-next-line no-shadow
function userJoin(id, username, room) {
  const user = { id, username, room }
  users.push(user)
  return user
}

function userLeave(id) {
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    return users.splice(index, 1)[0]
  }
  return console.log('Error deleting user')
}

// Security
app.use(helmet())

// Views
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(path.join(__dirname, 'public/css')))
app.use('/js', express.static(path.join(__dirname, 'public/js')))

// Additional config
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.get('/', (req, res) => {
  res.render('index')
})

app.post('/chat', (req, res) => {
  username = req.body.userName
  room = req.body.roomID
  res.render('chat', { username, room })
})

// SocketIO
io.of('/chat').on('connection', (socket) => {
  socket.on('new-connection', () => {
    const user = userJoin(socket.id, username, room)
    socket.join(user.room)
    socket.broadcast.to(user.room).emit('chat-msg', `${user.username} has connected!`)
  })
  socket.on('send-chat-message', (msg) => {
    const date = new Date().toLocaleTimeString('en-US', { hour12: true })
    if (msg.color) {
      socket.broadcast.to(msg.room).emit('chat-msg', `<span class="bold">${msg.userName}:</span> <span style="color: ${msg.color}">${msg.message}</span> <span class="timeStamp">${date}</span>`)
    } else if (msg.url) {
      if (msg.message.startsWith('https') || msg.message.startsWith('http')) {
        socket.broadcast.to(msg.room).emit('chat-msg', `<span class="bold">${msg.userName}:</span> <a href="//${msg.message.substring(8)}" target="_blank">${msg.message}</a> <span class="timeStamp">${date}</span>`)
      } else {
        socket.broadcast.to(msg.room).emit('chat-msg', `<span class="bold">${msg.userName}:</span> <a href="//${msg.message}" target="_blank">${msg.message}</a> <span class="timeStamp">${date}</span>`)
      }
    } else {
      socket.broadcast.to(msg.room).emit('chat-msg', `<span class="bold">${msg.userName}:</span> ${msg.message} <span class="timeStamp">${date}</span>`)
    }
  })
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)
    if (user) {
      socket.broadcast.to(user.room).emit('chat-msg', `${user.username} has disconnected!`)
    }
  })
})

// 404 Error
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => res.status(404).render('error', { err: '404', errDesc: "Page doesn't exist" }))

// 500 - Any server error
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).render('error', { err: '500', errDesc: 'Internal server error' }))

// Server listen
http.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`)
})

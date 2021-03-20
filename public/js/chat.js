// eslint-disable-next-line no-undef
const socket = io('/chat')

const form = document.querySelector('.form');
const input = document.querySelector('.textInput');
const messages = document.querySelector('.messages')
const userName = document.querySelector('.spanUser').innerText
const userRoom = document.querySelector('.spanRoom').innerText
const dcBtn = document.querySelector('.dcBtn')

function scroll() {
  messages.scrollTop = messages.scrollHeight
}

function addMessage(msg) {
  const msgDiv = document.createElement('p')
  msgDiv.className = 'message'
  msgDiv.innerHTML = msg
  messages.appendChild(msgDiv)
  scroll()
}

function addOwnMessage(msg) {
  const msgDiv = document.createElement('p')
  msgDiv.className = 'message ownMessage'
  msgDiv.innerHTML = msg
  messages.appendChild(msgDiv)
  scroll()
}

function validURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
        + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
        + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
        + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
        + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
        + '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

addMessage(`You have connected to ${userRoom}`)
socket.emit('new-connection')

socket.on('chat-msg', (data) => {
  addMessage(data)
})

dcBtn.addEventListener('click', () => {
  // eslint-disable-next-line no-restricted-globals
  location.href = '/'
})

form.addEventListener('submit', (e) => {
  let umsg
  let color
  e.preventDefault()
  if (input.value) {
    const date = new Date().toLocaleTimeString('en-US', { hour12: true })
    umsg = input.value
    if (input.value.startsWith('$')) {
      color = input.value.substring(0, 2)
      umsg = input.value.substring(2)
      // eslint-disable-next-line default-case
      switch (color) {
        case '$0':
          color = 'black'
          break
        case '$1':
          color = 'white'
          break
        case '$2':
          color = 'red'
          break
        case '$3':
          color = 'blue'
          break
        case '$4':
          color = 'cyan'
          break
        case '$5':
          color = 'green'
          break
        case '$6':
          color = 'yellow'
          break
        case '$7':
          color = 'orange'
          break
        case '$8':
          color = 'purple'
          break
        case '$9':
          color = 'gray'
          break
      }
      socket.emit('send-chat-message', {
        message: umsg, userName, room: userRoom, color,
      })
      addOwnMessage(`<span class="bold">You:</span> <span style="color: ${color}">${umsg}</span> <span class="timeStamp">${date}</span>`)
    } else if (validURL(input.value)) {
      socket.emit('send-chat-message', {
        message: umsg, userName, room: userRoom, url: true,
      })
      if (umsg.startsWith('https') || umsg.startsWith('http')) {
        addOwnMessage(`<span class="bold">You:</span> <a href="//${umsg.substring(8)}" target="_blank">${umsg}</a> <span class="timeStamp">${date}</span>`)
      } else {
        addOwnMessage(`<span class="bold">You:</span> <a href="//${umsg}" target="_blank">${umsg}</a> <span class="timeStamp">${date}</span>`)
      }
    } else {
      socket.emit('send-chat-message', { message: umsg, userName, room: userRoom })
      addOwnMessage(`<span class="bold">You:</span> ${umsg} <span class="timeStamp">${date}</span>`)
    }
    input.value = ''
  }
})

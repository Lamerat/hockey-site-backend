import socketIO from 'socket.io'
import * as controller from '../controllers/socket.js'
import authSocket from '../middleware/auth-socket.js'

export default (http) => {
  const io = socketIO(http)

  io.use(authSocket).on('connect', socket => {
    controller.init(socket)

    socket.on('socket-message', (payload) => {
      controller[payload.action] && controller[payload.action](payload.payload, socket)
    })

    socket.on('disconnect', () =>
      controller.disconnect(socket)
    )
  })

  return io
}
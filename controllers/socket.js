import { terminal } from '@sea_flanker/terminal'
import { io } from '../index.js'
import settings from '../config/settings.js'

const socketMsg = settings.socketMessage

export const init = (socket) => {
  terminal.cyan().log(`SOCKET CONNECTED: ${socket.id}`)
}


export const disconnect = (socket) => {
  terminal.cyan().log(`SOCKET DISCONNECTED: ${socket.id}`)
}
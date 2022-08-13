import jwt from 'jsonwebtoken'
import { terminal } from '@sea_flanker/terminal'
import settings from '../config/settings.js'
import User from '../models/User.js'


export default (socket, next) => {
  const { token } = socket.handshake.query
  if (!token) {
    terminal.red().log('SOCKET: Token missing in handshake query!')
    return next(new Error('Socket Authentication Failed'))
  }

  jwt.verify(token, settings.jwtKey, (err, decoded) => {
    if (err) return next(new Error('Socket Authentication Failed'))

    const tokenDate = decoded.tokenDate
    const userId = decoded.sub
    User.findOne({ _id: userId, tokenDate }).lean()
      .then(user => {
        if (!user) {
          terminal.red().log('SOCKET: Authentication failed - no such user or token expired')
          return next(new Error('Socket Authentication Failed'))
        }
        socket.user = user._id
        return next()
      })
  })
}
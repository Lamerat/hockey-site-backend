import express from 'express'
import * as httpLib from 'http'
import settings from './config/settings.js'
import database from './config/database.js'
import routes from './routes/index.js'
import { terminal } from '@sea_flanker/terminal'
import socket from './config/socket.js'
import expressConfig from './config/express.js'

const app = express()
expressConfig(app)

const http = httpLib.Server(app)
database(settings.db)

export const io = socket(http)

routes(app)

http.listen(settings.port, () => {
  terminal.green().log(`SERVER IS ARMED AND READY ON PORT: ${settings.port}`)
})


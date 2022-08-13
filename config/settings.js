import path from 'path'
import 'dotenv/config'


// SERVER SETTINGS
const __dirname = path.resolve()
const rootPath = path.normalize(path.join(__dirname, '/../'))
const port = process.env.PORT || 5000
const jwtKey = process.env.JWT_KEY || '09daj0932r4ujlkfjsdof98jkiuyuoijhnasoi6yHUIJKHSDui6o@$cSt'
const env = process.env.NODE_ENV || 'development'

// SOCKET SETTINGS
const socketMessage = 'socket-message'

// DATABASE SETTINGS
const databaseAddress = {
  development: process.env.DEV_DB || `mongodb+srv://root:parola@cluster0.6hjje.mongodb.net/test-dev?retryWrites=true&w=majority`,
  production: process.env.PROD_DB || 'mongodb+srv://root:parola@cluster0.6hjje.mongodb.net/test-prod?retryWrites=true&w=majority'
}

const settings = {
  rootPath,
  port,
  db: databaseAddress[env],
  jwtKey,
  socketMessage,
}

export default settings
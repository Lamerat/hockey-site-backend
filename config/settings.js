import path from 'path'
import 'dotenv/config'


// SERVER SETTINGS
const __dirname = path.resolve()
const rootPath = path.normalize(path.join(__dirname, '/../'))
const port = process.env.PORT || 5000
const jwtKey = process.env.JWT_KEY || '09daj0932r4ujlkfjsdof98jkiuyuoijhnasoi6yHUIJKHSDui6o@$cSt'
const env = process.env.NODE_ENV || 'development'
const defaultTeamLogo = process.env.DEFAULT_TEAM_LOGO || 'https://iili.io/gqmXBj.png'

// SOCKET SETTINGS
const socketMessage = 'socket-message'

// ROLES
const roles = {
  root: 'root',
  admin: 'admin',
  user: 'user'
}

// PLAYER POSITIONS
const positions = {
  goalie: 'goalie',
  guard: 'guard',
  attacker: 'attacker'
}

// DATABASE SETTINGS
const databaseAddress = {
  development: process.env.DEV_DB || `mongodb+srv://root:k4rbur4tor@cluster0.7zjjw.mongodb.net/hockey-dev?retryWrites=true&w=majority`,
  production: process.env.PROD_DB || 'mongodb+srv://root:k4rbur4tor@cluster0.7zjjw.mongodb.net/hockey-prod?retryWrites=true&w=majority'
}

const settings = {
  rootPath,
  port,
  db: databaseAddress[env],
  jwtKey,
  socketMessage,
  roles,
  defaultTeamLogo,
  positions,
}

export default settings
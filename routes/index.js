import user from './user.js'
import city from './city.js'
import team from './team.js'
import arena from './arena.js'

/**
 * Main router
 * @param {import('express').Application} app 
 */
export default (app) => {
  app.get('/', (_, res) => res.status(200).send('Hello').end())
  app.use('/user', user)
  app.use('/city', city)
  app.use('/arena', arena)
  app.use('/team', team)
  app.all('*', (_, res) => res.status(404).send('404 Not Found!').end())
}
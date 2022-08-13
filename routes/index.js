import user from './user.js'

/**
 * Main router
 * @param {import('express').Application} app 
 */
export default (app) => {
  app.get('/', (_, res) => res.status(200).send('Hello').end())
  app.use('/user', user)
  app.all('*', (_, res) => res.status(404).send('404 Not Found!').end())
}
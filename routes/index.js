import user from './user.js'
import city from './city.js'
import team from './team.js'
import arena from './arena.js'
import files from './files.js'
import news from './news.js'
import album from './album.js'
import photo from './photo.js'
import player from './player.js'
import event from './event.js'
import info from './info.js'

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
  app.use('/files', files)
  app.use('/news', news)
  app.use('/album', album)
  app.use('/photo', photo)
  app.use('/player', player)
  app.use('/event', event)
  app.use('/info', info)
  app.all('*', (_, res) => res.status(404).send('404 Not Found!').end())
}
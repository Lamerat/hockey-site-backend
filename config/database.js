import mongoose from 'mongoose'
import { terminal } from '@sea_flanker/terminal'

export default (database) => {
  mongoose.connect(database, { useNewUrlParser: true, useUnifiedTopology: true })  
  const db = mongoose.connection

  db.once('open', err => {
    if (err) throw err
    terminal.green().log('DATABASE STATUS: READY')
  })

  db.on('error', err => terminal.red().log(`DATABASE ERROR -> ${err}`))
}
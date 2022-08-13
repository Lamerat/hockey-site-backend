import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
const disabledPaths = ['/payment/verify']

const toUse = (fn) => {
  return (req, res, next) => {
    if (disabledPaths.indexOf(req.path) !== -1) {
      next()
    } else {
      fn(req, res, next)
    }
  }
}

const toUseSpecial = (fn, path) => {
  return (req, res, next) => {
    if (req.path === path) {
      fn(req, res, next)
    } else {
      next()
    }
  }
}


/**
 * Main router
 * @param {import('express').Application} app 
 */
const expressConfig = (app) => {
  app.use('/public', express.static('public')) // Serving static files from /public dir
  app.use(toUse(bodyParser.urlencoded({ extended: false }))) // Parsing urlencoded bodies
  app.use(toUse(bodyParser.json())) // Ability to send JSON responses
  app.use(toUseSpecial(bodyParser.text({ type: '*/*' }), '/payment/verify'))
  app.use(cors())

  const getDurationInMilliseconds = (start) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = process.hrtime(start)

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
  }

  app.use((req, res, next) => {
    const start = process.hrtime()
    res.on('finish', () => {
      const durationInMilliseconds = getDurationInMilliseconds(start)
      console.log(`Request time: ${req.method} ${req.originalUrl} - ${durationInMilliseconds} ms`)
    })
    next()
  })
}

export default expressConfig

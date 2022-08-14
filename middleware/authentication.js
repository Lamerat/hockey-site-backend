import jsonwebtoken from 'jsonwebtoken'
import * as rest from '../utilities/express-helpers.js'
import settings from '../config/settings.js'
import User from '../models/User.js'
import CError from '../utilities/CError.js'

/** @type { import('express').RequestHandler } */
const authentication = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) return rest.errorRes(res, new CError('Access denied!', 401))

  jsonwebtoken.verify(token, settings.jwtKey, (err, decoded) => {
    if (err) return rest.errorRes(res, new CError('Access denied!', 401))

    const { sub: _id, tokenDate } = decoded

    User.findOne({ _id, tokenDate, deletedAt: null }).lean()
      .then(user => {
        if (!user) throw new CError('Access denied!', 401)
        req.user = {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          team: user.team
        }
        next()
      })
      .catch((error) => rest.errorRes(res, error))
  })
}


export default authentication
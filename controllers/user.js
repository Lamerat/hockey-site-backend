import jsonwebtoken from 'jsonwebtoken'
import User from '../models/User.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { generateHashedPassword, generateSalt } from '../utilities/encryption.js'
import settings from '../config/settings.js'


/** @type { import('express').RequestHandler } */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).populate({ path: 'team', select: 'name' })
    if (!user) throw new CError(`Такъв потребител не съществува!`, 404)
    if (user && !user.authenticate(password.trim())) throw new CError(`Неуспешна идентификация!`, 401)

    const tokenDate = new Date()
    await User.findOneAndUpdate({ _id: user._id }, { tokenDate }, {})

    const token = jsonwebtoken.sign({ sub: user._id, tokenDate }, settings.jwtKey)

    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team
    }
    const result = { token, user: userData }
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { email, password, name } = req.body

    const checkUser = await User.findOne({ email: email.trim().toLowerCase() }).lean()
    if (checkUser) throw new Error (`User with this e-mail already exists!`)

    const salt = generateSalt()
    const newUserData = {
      email: email.trim().toLowerCase(),
      salt,
      password: generateHashedPassword(salt, password.trim()),
      name,
    }
    
    const result = await User.create(newUserData)
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
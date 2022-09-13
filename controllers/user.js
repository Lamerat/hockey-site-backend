import jsonwebtoken from 'jsonwebtoken'
import User from '../models/User.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { generateHashedPassword, generateSalt } from '../utilities/encryption.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'


const loginValidator = new Validator()
loginValidator.addField({ name: 'email', type: 'Email', required: true })
loginValidator.addField({ name: 'password', type: 'String', options: { minSymbols: 6 }, required: true })

const nameValidator = new Validator()
nameValidator.addField({ name: 'name', type: 'String', 'required': true, options: { maxWords: 2, include: 'lettersOnly', minSymbols: 2 } })

/** @type { import('express').RequestHandler } */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email) throw new CError(`Missing 'email'!`)
    if (!password) throw new CError(`Missing 'password'!`)

    const validate = loginValidator.validate(req.body, true)
    if (!validate.success) throw new CError(validate.errors, 422)

    const user = await User.findOne({ email: email.toLowerCase() }).populate({ path: 'team', select: 'name' })
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
    const { _id, team} = req.user
    const { email, password, name } = req.body

    const checkUser = await User.findOne({ email: email.trim().toLowerCase() }).lean()
    if (checkUser) throw new Error (`User with this e-mail already exists!`)

    const salt = generateSalt()
    const newUserData = {
      email: email.trim().toLowerCase(),
      salt,
      password: generateHashedPassword(salt, password.trim()),
      name,
      team,
      createdBy: _id
    }
    
    const result = await User.create(newUserData)
    rest.successRes(res, { message: 'Новият потребител e създаден успешно.' })
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const userProfile = async (req, res) => {
  try {
    const { _id } = req.user

    const result = await User.findOne({ _id }).populate({ path: 'team', select: 'name' }).select('email name team').lean()

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const editProfile = async (req, res) => {
  try {
    const { _id } = req.user
    const { name } = req.body

    if (!name) throw new CError(`Missing field 'name'!`)
    const validate = nameValidator.validate(req.body)
    if (!validate.success) throw new CError(validate.errors)

    const result = await User.findOneAndUpdate({ _id }, { name }, { new: true, runValidators: true }).populate({ path: 'team', select: 'name' }).select('email name team').lean()

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const changePassword = async (req, res) => {
  try {
    const { _id } = req.user
    const { password, newPassword, reNewPassword } = req.body

    if (!password) throw new CError(`Missing field 'password'!`)
    if (!newPassword) throw new CError(`Missing field 'newPassword'!`)
    if (!reNewPassword) throw new CError(`Missing field 'reNewPassword'!`)
    if (newPassword.trim() !== reNewPassword.trim()) throw new CError(`New password not match re-enter new password!`)
    if ([newPassword, reNewPassword].some(x => x.length < 6)) throw new CError(`Password must be min. 6 symbols!`)

    const myProfile = await User.findOne({ _id })
    if (!myProfile.authenticate(password.trim())) throw new CError('Грешна парола!')

    const salt = generateSalt()
    const newUserData = { salt, password: generateHashedPassword(salt, newPassword.trim()) }

    await User.findOneAndUpdate({ _id }, { ...newUserData }, {})

    rest.successRes(res, { message: 'Паролата е променена успешно!' })
  } catch (error) {
    rest.errorRes(res, error)
  }
}
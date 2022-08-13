import Team from '../models/Team.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { name, city, logo } = req.body

    const result = await Team.create({ name, city, logo })
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
import City from '../models/City.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { name } = req.body
    const result = await City.create({name})
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
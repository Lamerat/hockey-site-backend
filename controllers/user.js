import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'

/** @type { import('express').RequestHandler } */
export const register = async (req, res) => {
  try {
    const result = 'OK'
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
import Event from '../models/Event.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { team, _id: createdBy } = req.user

    const result = await Event.create({ ...body, team, createdBy })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
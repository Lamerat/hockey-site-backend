import City from '../models/City.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'name', type: 'String', options: { canBeEmpty: false, min: 2 }, required: true })
bodyValidator.addField({ name: 'shared', type: 'Boolean', required: false })
bodyValidator.addField({ name: 'type', type: 'String', options: { enum: ['system', 'personal'] }, required: false })


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { _id, role } = req.user

    const validate = bodyValidator.validate(body, true)
    if (!validate.success) throw new CError(validate.errors, 422)
    if (body?.type === 'system' && role !== settings.roles.root ) throw new CError(`Only root can add 'system' records!`, 403)

    const result = await City.create({ ...body, createdBy: _id })
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const single = async (req, res) => {
  try {
    const { _id } = req.params
    const { _id: user } = req.user

    const filter = [
      { createdBy: user },
      { type: 'system' },
      { shared: true }
    ]
    
    const result = await City.findOne({ _id, $or: filter }).lean()
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, search } = req.body
    const { _id: user } = req.user

    const filter = [
      { createdBy: user },
      { type: 'system' },
      { shared: true }
    ]

    const query = { deletedAt: null, $or: filter }
    
    const result = await City.paginate(query, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      sort: { createdAt: -1 },
      lean: true,
      pagination: noPagination ? false : true,
      select: '-__v -deletedAt',
      populate: { path: 'createdBy', select: 'name' }
    })
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
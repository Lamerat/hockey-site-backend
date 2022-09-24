import Info from '../models/Info.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import { validateId } from '../utilities/help-functions.js'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'shortTitle', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: true })
bodyValidator.addField({ name: 'longTitle', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: true })
bodyValidator.addField({ name: 'text', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: true })
bodyValidator.addField({ name: 'position', type: 'Number', options: { min: 1 }, required: true })

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { shortTitle, longTitle, text, position } = req.body
    const { _id: createdBy, team } = req.user

    if (!shortTitle) throw new CError(`Missing field 'shortTitle'`)
    if (!longTitle) throw new CError(`Missing field 'longTitle'`)
    if (!text) throw new CError(`Missing field 'text'`)
    if (!position || isNaN(parseInt(position)) || Number(position) < 1) throw new CError(`Missing or invalid field 'position'`)

    const validate = bodyValidator.validate(req.body)
    if (!validate.success) throw new CError(validate.errors)

    const checkFirst = await Info.findOne({ shortTitle: shortTitle.trim(), team, deletedAt: null }).lean()
    if (checkFirst) throw new CError(`Статия с това име вече съществува!`)

    const result = await Info.create({ shortTitle, longTitle, text, position, createdBy, team })
    await Info.updateMany({ team, deletedAt: null, position: { $gte: position }, _id: { $ne: result._id } }, { $inc: { position: 1 } })
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, sort } = req.body
    const { team } = req.user

    const query = { team, deletedAt: null }

    const result = await Info.paginate(query, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: !noPagination,
      sort: sort || { position: 1 },
      populate: { path: 'createdBy', select: 'name' },
      lean: true
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const single = async (req, res) => {
  try {
    const { _id } = req.params
    await validateId(_id)

    const result = await Info.findOne({ _id, deletedAt: null }).populate({ path: 'createdBy', select: 'name' }).lean()
    if (!result) throw new CError(`Статия с такъв идентификационен номер не съществува!`)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const edit = async (req, res) => {
  try {
    const { _id } = req.params
    const { body } = req
    const { team } = req.user
    await validateId(_id)
    
    const validate = bodyValidator.validate(body, false)
    if (!validate.success) throw new CError(validate.errors)

    if (body.shortTitle) {
      const checkFirst = await Info.findOne({ shortTitle: body.shortTitle.trim(), team, deletedAt: null, _id: { $ne: _id } }).lean()
      if (checkFirst) throw new CError(`Статия с това име вече съществува!`)
    }

    const oldData = await Info.findOne({ _id, team, deletedAt: null }).lean()
    if (!oldData) throw new CError(`Статия с такъв идентификационен номер не съществува!`)

    const result = await Info.findOneAndUpdate({ _id, team, deletedAt: null }, { ...body }, { new: true, runValidators: true }).populate({ path: 'createdBy', select: 'name' }).lean()

    if (body.position && body.position !== oldData.position) {
      await Info.updateMany({ team, deletedAt: null, position: { $gte: body.position }, _id: { $ne: _id } }, { $inc: { position: 1 } })
    }
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const remove = async (req, res) => {
  try {
    const { _id } = req.params
    const { team } = req.user
    await validateId(_id)

    const result = await Info.findOneAndUpdate({ _id, team, deletedAt: null }, { deletedAt: new Date() }, { new: true, runValidators: true })
      .populate({ path: 'createdBy', select: 'name' }).lean()
    if (!result) throw new CError(`Статия с такъв идентификационен номер не съществува!`)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const publicList = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, team } = req.body
    
    if (!team) throw new CError(`Missing field 'team'`)
    await validateId(team)

    const query = { team, deletedAt: null }

    const result = await Info.paginate(query, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: !noPagination,
      sort: { position: 1 },
      lean: true
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
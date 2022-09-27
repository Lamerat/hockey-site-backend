import Banner from '../models/Banner.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import { ObjectId, validateId } from '../utilities/help-functions.js'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'position', type: 'Number', options: { min: 1 }, required: true })
bodyValidator.addField({ name: 'link', type: 'URL', required: true })
bodyValidator.addField({ name: 'photo', type: 'URL', required: true })
bodyValidator.addField({ name: 'text', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: false })


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { position, link, photo, text } = req.body
    const { _id: createdBy, team } = req.user

    if (!position || isNaN(parseInt(position)) || Number(position) < 1) throw new CError(`Missing or invalid field 'position'`)
    if (!link) throw new CError(`Missing field 'link'`)
    if (!photo) throw new CError(`Missing field 'photo'`)

    const validate = bodyValidator.validate(req.body)
    if (!validate.success) throw new CError(validate.errors)

    const result = await Banner.create({ position, link, photo, text, createdBy, team })
    await Banner.updateMany({ team, deletedAt: null, position: { $gte: position }, _id: { $ne: result._id } }, { $inc: { position: 1 } })
    
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

    const pipeline = [
      { $match: { deletedAt: null, team } },
      {
        $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
            pipeline: [{ $project: { _id: 1, name: 1 } }]
        },
      },
      { $unwind: '$createdBy' }
    ]

    const aggregateQuery = Banner.aggregate(pipeline)

    const result = await Banner.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: !noPagination,
      sort: sort || { position: 1 },
      lean: true,
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

    const result = await Banner.findOne({ _id, deletedAt: null }).populate({ path: 'createdBy', select: 'name' }).lean()
    if (!result) throw new CError(`Банер с такъв идентификационен номер не съществува!`)

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

    const oldData = await Banner.findOne({ _id, team, deletedAt: null }).lean()
    if (!oldData) throw new CError(`Банер с такъв идентификационен номер не съществува!`)

    const result = await Banner.findOneAndUpdate({ _id, team, deletedAt: null }, { ...body }, { new: true, runValidators: true })
      .populate({ path: 'createdBy', select: 'name' })
      .lean()

    if (body.position && body.position !== oldData.position) {
      await Banner.updateMany({ team, deletedAt: null, position: { $gte: body.position }, _id: { $ne: _id } }, { $inc: { position: 1 } })
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

    const result = await Banner.findOneAndUpdate({ _id, team, deletedAt: null }, { deletedAt: new Date() }, { new: true, runValidators: true })
      .populate({ path: 'createdBy', select: 'name' }).lean()
    if (!result) throw new CError(`Банер с такъв идентификационен номер не съществува!`)

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

    const aggregateQuery = Banner.aggregate([{ $match: { deletedAt: null, team: ObjectId(team) } }, { $project: { _id: 1, photo: 1, text: 1, link: 1, position: 1 } }])

    const result = await Banner.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: !noPagination,
      sort: { position: 1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
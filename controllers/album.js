import Album from '../models/Album.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import { validateId } from '../utilities/help-functions.js'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'name', type: 'String', options: { minSymbols: 2 }, required: true })

const listValidator = new Validator()
listValidator.addField({ name: 'pageNumber', type: 'Number', options: { min: 1 }, required: false })
listValidator.addField({ name: 'pageSize', type: 'Number', options: { min: 1 }, required: false })
listValidator.addField({ name: 'noPagination', type: 'Boolean', required: false })


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { name } = req.body
    const { _id: createdBy, team } = req.user

    if (!name) throw new CError(`Missing 'name'`, 422)

    const validate = bodyValidator.validateFields('name', req.body, true)
    if (!validate.success) throw new CError(validate.errors, 422)

    const checkForExists = await Album.findOne({ name, team }).lean()
    if (checkForExists) throw new CError(`Албум с име '${name.trim()}' вече съществува!`)

    const result = await Album.create({ name, createdBy, team })    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination } = req.body
    const { team } = req.user

    const validate = listValidator.validate(req.body)
    if (!validate.success) throw new Error(validate.errors)
    
    const filter = { deletedAt: null, team }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
            pipeline: [
              { $project: { _id: 1, name: 1 } }
            ]
        },
      },
      { $unwind: '$createdBy' },
      { $project: { _id: 1, name: 1, createdBy: 1, createdAt: 1, locked: 1, main: 1 } }
    ]

    const aggregateQuery = Album.aggregate(pipeline)

    const result = await Album.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: { main: -1, createdAt: -1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const edit = async (req, res) => {
  try {
    const { _id } = req.params
    const { name } = req.body
    const { team } = req.user

    if (!name) throw new CError(`Missing 'name'`, 422)
    await validateId(_id)

    const validate = bodyValidator.validateFields('name', req.body, true)
    if (!validate.success) throw new CError(validate.errors, 422)

    const checkForExists = await Album.findOne({ _id: { $ne: _id }, name, team }).lean()
    if (checkForExists) throw new CError(`Албум с име '${name.trim()}' вече съществува!`)

    const result = await Album.findOneAndUpdate({ _id, team, deletedAt: null }, { name }, { new: true, runValidators: true})
      .populate({ path: 'createdBy', select: 'name' })
      .lean()
    if (!result) throw new CError(`Такъв албум не съществува или нямате правомощия да го редактирате!`)

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

    const result = await Album.findOneAndUpdate({ _id, team, deletedAt: null }, { deletedAt: new Date() }, { new: true, runValidators: true})
      .populate({ path: 'createdBy', select: 'name' })
      .lean()
    if (!result) throw new CError(`Такъв албум не съществува или нямате правомощия да го изтриете!`)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const setMain = async (req, res) => {
  try {
    const { _id } = req.params
    const { team } = req.user
    await validateId(_id)

    const result = await Album.findOneAndUpdate({ _id, team, deletedAt: null }, { main: true }, { new: true, runValidators: true})
      .populate({ path: 'createdBy', select: 'name' })
      .lean()

    if (!result) throw new CError(`Такъв албум не съществува!`)

    await Album.findOneAndUpdate({ _id: { $ne: _id }, team, deletedAt: null, main: true }, { main: false }, {})

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
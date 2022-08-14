import City from '../models/City.js'
import User from '../models/User.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'name', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: true })
bodyValidator.addField({ name: 'shared', type: 'Boolean', required: false })
bodyValidator.addField({ name: 'type', type: 'String', options: { enum: ['system', 'personal'] }, required: false })

const formatCityName = (name) => name.split(' ').filter(x => x !== '').map(s => s && s[0].toUpperCase() + s.slice(1)).join(' ')

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { _id, role, team } = req.user

    if (!body.name) throw new CError(`'Missing field 'name'`)
    const validate = bodyValidator.validate(body, true)
    if (!validate.success) throw new CError(validate.errors, 422)
    if (body?.type === 'system' && role !== settings.roles.root ) throw new CError(`Only root can add 'system' records!`, 403)

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id.toString())
    body.name = formatCityName(body.name)

    const checkForExist = await City.find({ name: body.name }).lean()
    if (checkForExist.some(x => x.type === 'system')) throw new CError(`Има добавен системно град с име '${body.name}'`, 409)
    if (checkForExist.some(x => members.includes(x.createdBy.toString()))) throw new CError(`Вече имате добавен град с име '${body.name}'`, 409)

    const result = await City.create({ ...body, createdBy: _id })
    rest.successRes(res, { ...result.toObject(), canEdit: true })
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const single = async (req, res) => {
  try {
    const { _id } = req.params
    const { team } = req.user

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id)

    const filter = { _id, deletedAt: null, $or: [{ createdBy: { $in: members } }, { type: 'system' }, { shared: true }] }
    
    const result = await City.findOne(filter).populate({ path: 'createdBy', select: 'name' }).lean()
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

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id)
    
    const filter = { deletedAt: null, $or: [{ createdBy: { $in: members } }, { type: 'system' }, { shared: true }] }

    const pipeline = [
      { $match: filter },
      { $addFields: { canEdit: { $cond: [ { $and: [ { $in: [ '$createdBy', members ] }, { $ne: ['$type', 'system'] }] }, true, false] } } }
    ]

    const aggregateQuery = City.aggregate(pipeline)

    const result = await City.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: { type: -1, canEdit: -1 },
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
    const { name, shared } = req.body
    const { team } = req.user

    const convertName = formatCityName(name)

    const validate = bodyValidator.validate(req.body, false)
    if (!validate.success) throw new CError(validate.errors, 422)

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id.toString())

    const checkForExist = await City.find({ name: convertName, _id: { $ne: _id } }).lean()
    if (checkForExist.some(x => x.type === 'system')) throw new CError(`Има добавен системно град с име '${convertName}'`, 409)
    if (checkForExist.some(x => members.includes(x.createdBy.toString()))) throw new CError(`Вече имате добавен град с име '${convertName}'`, 409)

    const filter = { _id, deletedAt: null, type: { $ne: 'system' }, createdBy: { $in: members } }
    
    const result = await City.findOneAndUpdate({ ...filter }, { name: convertName, shared }, { new: true, runValidators: true }).lean()
    if (!result) throw new CError(`Такъв град не съществува или нямате правомощия да го редактирате!`)
    
    rest.successRes(res, { ...result, canEdit: true})
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const remove = async (req, res) => {
  try {
    const { _id } = req.params
    const { team } = req.user

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id)

    const filter = { _id, deletedAt: null, type: { $ne: 'system' }, createdBy: { $in: members } }
    
    const result = await City.findOneAndUpdate({ ...filter }, { deletedAt: new Date() }, { new: true, runValidators: true }).lean()
    if (!result) throw new CError(`Такъв град не съществува или нямате правомощия да го изтриете!`)
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
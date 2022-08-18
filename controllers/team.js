import Team from '../models/Team.js'
import User from '../models/User.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'
import { validateId } from '../utilities/help-functions.js'


const bodyValidator = new Validator()
bodyValidator.addField({ name: 'name', type: 'String', options: { canBeEmpty: false, minSymbols: 2 }, required: true })
bodyValidator.addField({ name: 'city', type: 'Mongo', required: true })
bodyValidator.addField({ name: 'shared', type: 'Boolean', required: false })
bodyValidator.addField({ name: 'logo', type: 'URL', required: false })
bodyValidator.addField({ name: 'type', type: 'String', options: { enum: ['system', 'personal'] }, required: false })


const formatTeamName = (name) => {
  const removeSpaces = name.split(' ')
  .filter(x => x !== '')
  .map(x => {
    if (x[0].toUpperCase() === x[0]) {
      const temp = x.toLowerCase()
      return temp[0].toUpperCase() + temp.slice(1)
    }
    return x.toLowerCase()
  })
  .join(' ')

  return removeSpaces[0].toUpperCase() + removeSpaces.slice(1)
} 


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

    body.name = formatTeamName(body.name)
    if (!body.logo) body.logo = settings.defaultTeamLogo

    const checkForExist = await Team.find({ name: body.name, deletedAt: null, city: body.city }).populate({ path: 'city', select: 'name' }).lean()
    if (checkForExist.some(x => x.type === 'system')) throw new CError(`Има добавен системно отбор с име '${body.name}' от град ${checkForExist[0].city.name}`, 409)
    if (checkForExist.some(x => members.includes(x.createdBy.toString()))) throw new CError(`Вече имате добавен отбор с име '${body.name}' от град ${checkForExist[0].city.name}`, 409)


    const newTeam = await Team.create({ ...body, createdBy: _id })
    const result = await Team.populate(newTeam, { path: 'city', select: 'name' })

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
    await validateId(_id)

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id)

    const filter = { _id, deletedAt: null, $or: [{ createdBy: { $in: members } }, { type: 'system' }, { shared: true }] }
    
    const result = await Team.findOne(filter).populate([{ path: 'createdBy', select: 'name' }, { path: 'city', select: 'name' }]).lean()
    if (!result) throw new CError(`Няма отбор с такъв идентификационен номер!`, 404)

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
      { $addFields: { canEdit: { $cond: [ { $and: [ { $in: [ '$createdBy', members ] }, { $ne: ['$type', 'system'] }] }, true, false] } } },
      {
        $lookup: {
            'from': 'cities',
            'localField': 'city',
            'foreignField': '_id',
            'as': 'city',
        },
      },
      { $unwind: '$city' }
    ]

    const aggregateQuery = Team.aggregate(pipeline)

    const result = await Team.aggregatePaginate(aggregateQuery, {
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
    const { name, city } = req.body
    const { team } = req.user
    await validateId(_id)

    if (name) req.body.name = formatTeamName(name)

    const validate = bodyValidator.validate(req.body, false)
    if (!validate.success) throw new CError(validate.errors, 422)

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id.toString())

    const checkFilter = { _id: { $ne: _id }, deletedAt: null }
    if (name && city) {
      checkFilter.city = city
      checkFilter.name = req.body.name
    } else if ((name && !city) || (!name && city) ) {
      const oldData = await Team.findOne({ _id, deletedAt: null }).lean()
      if (!oldData) throw new CError(`Такъв отбор не съществува или нямате правомощия да го редактирате!`)
      checkFilter.city = city || oldData.city
      checkFilter.name = name || oldData.name
    }

    if (name || city) {
      const checkForExist = await Team.find(checkFilter).populate({ path: 'city', select: 'name' }).lean()
      if (checkForExist.some(x => x.type === 'system'))
        throw new CError(`Има добавен системно отбор с име '${req.body.name || checkFilter.name}' от град ${checkForExist[0].city.name}`, 409)

      if (checkForExist.some(x => members.includes(x.createdBy.toString())))
        throw new CError(`Вече имате добавен отбор с име '${req.body.name || checkFilter.name}' от град ${checkForExist[0].city.name}`, 409)
    }

    const filter = { _id, deletedAt: null, type: { $ne: 'system' }, createdBy: { $in: members } }
    
    const result = await Team.findOneAndUpdate({ ...filter }, { ...req.body }, { new: true, runValidators: true }).populate({ path: 'city', select: 'name' }).lean()
    if (!result) throw new CError(`Такъв отбор не съществува или нямате правомощия да го редактирате!`)
    
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
    await validateId(_id)

    const getTeamMembers = await User.find({ team }).select('_id').lean()
    const members = getTeamMembers.map(x => x._id)

    const filter = { _id, deletedAt: null, type: { $ne: 'system' }, createdBy: { $in: members } }
    
    const result = await Team.findOneAndUpdate({ ...filter }, { deletedAt: new Date() }, { new: true, runValidators: true }).populate({ path: 'city', select: 'name' }).lean()
    if (!result) throw new CError(`Такъв отбор не съществува или нямате правомощия да го редактирате!`)
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
import Event from '../models/Event.js'
import CError from '../utilities/CError.js'
import * as rest from '../utilities/express-helpers.js'
import { Validator } from 'body-validator-v2'
import { validateId, ObjectId } from '../utilities/help-functions.js'
import moment from 'moment'


const gameValidator = new Validator()
gameValidator.addField({ name: 'date', type: 'Date', required: true })
gameValidator.addField({ name: 'arena', type: 'Mongo', required: true })
gameValidator.addField({ name: 'homeTeam', type: 'Mongo', required: true })
gameValidator.addField({ name: 'visitorTeam', type: 'Mongo', required: true })
gameValidator.addField({ name: 'description', type: 'String', required: false })
gameValidator.addField({ name: 'overtime', type: 'String', options: { enum: ['overtime', 'penalties', 'draw', '']}, required: false })
gameValidator.addField({ name: 'firstThird.home', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'firstThird.visitor', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'secondThird.home', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'secondThird.visitor', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'thirdThird.home', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'thirdThird.visitor', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'finalScore.home', type: 'Number', options: { min: 0, max: 99 }, required: false })
gameValidator.addField({ name: 'finalScore.visitor', type: 'Number', options: { min: 0, max: 99 }, required: false })

const trainingValidator = new Validator()
trainingValidator.addField({ name: 'date', type: 'Date', required: true })
trainingValidator.addField({ name: 'arena', type: 'Mongo', required: true })
trainingValidator.addField({ name: 'description', type: 'String', required: false })

const otherEventValidator = new Validator()
otherEventValidator.addField({ name: 'date', type: 'Date', required: true })
otherEventValidator.addField({ name: 'city', type: 'Mongo', required: true })
otherEventValidator.addField({ name: 'description', type: 'String', required: false })

const populate = [
  { path: 'createdBy', select: 'name' },
  { path: 'city', select: 'name' },
  { path: 'homeTeam', select: 'name', populate: { path: 'city', select: 'name' } },
  { path: 'visitorTeam', select: 'name', populate: { path: 'city', select: 'name' } },
  { path: 'arena', select: 'name', populate: { path: 'city', select: 'name' } }
]


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { team, _id: createdBy } = req.user
    const validTypes = ['game', 'training', 'other']

    if (!body.type) throw new CError(`Missing 'type'!`)
    if (!validTypes.includes(body.type)) throw new CError(`Invalid field 'type'! Must be ${validTypes.join(', ')}`)

    if (body.type === 'game') {
      const validate = gameValidator.validate(body, true)
      if (!validate.success) throw new CError(validate.errors)
      if (body.homeTeam !== team.toString() && body.visitorTeam !== team.toString()) throw new CError(`Можете да добавяте игри само с участието на вашия отбор!`)
      if (body.homeTeam === body.visitorTeam) throw new CError(`Двата отбора трябва да бъдат различни!`)
    } else if (body.type === 'training') {
      const validate = trainingValidator.validate(body, true)
      if (!validate.success) throw new CError(validate.errors)
    } else {
      const validate = otherEventValidator.validate(body, true)
      if (!validate.success) throw new CError(validate.errors)
    }

    const result = await Event.create({ ...body, team, createdBy })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, sort, type, startDate, endDate, homeTeam, visitorTeam, arena, city, createdBy } = req.body
    const { team } = req.user
    
    const filter = { deletedAt: null, team }
    const lastFilter = {}

    if (startDate && endDate) {
      const minDate = moment(startDate).startOf('day').add(2, 'hours').toDate()
      const maxDate = moment(endDate).endOf('day').add(3, 'hours').toDate()
      filter.date = { $gte: minDate, $lte: maxDate }
    }

    if (type && Array.isArray(type) && type.length) filter.type = { $in: type }
    
    if (homeTeam) {
      await validateId(homeTeam)
      filter.homeTeam = ObjectId(homeTeam)
    }

    if (visitorTeam) {
      await validateId(visitorTeam)
      filter.visitorTeam = ObjectId(visitorTeam)
    }

    if (arena) {
      await validateId(arena)
      filter.arena = ObjectId(arena)
    }

    if (createdBy) {
      await validateId(createdBy)
      filter.createdBy = ObjectId(createdBy)
    }

    if (city) {
      await validateId(city)
      lastFilter['city._id'] = ObjectId(city)
    }

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
      {
        $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
            pipeline: [
              { $project: { _id: 1, name: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'arenas',
            localField: 'arena',
            foreignField: '_id',
            as: 'arena',
            pipeline: [
              {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city',
                    pipeline: [
                      { $project: { _id: 1, name: 1 } }
                    ]
                }
              },
              { $unwind: '$city' },
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'homeTeam',
            foreignField: '_id',
            as: 'homeTeam',
            pipeline: [
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'visitorTeam',
            foreignField: '_id',
            as: 'visitorTeam',
            pipeline: [
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$homeTeam', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$visitorTeam', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$arena', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: 1,
          date: 1,
          arena: 1,
          description: 1,
          homeTeam: 1,
          visitorTeam: 1,
          createdBy: 1,
          finalScore: 1,
          createdAt: 1,
          overtime: 1,
          city: { $cond: { if: { $ne: ['$type', 'other'] }, then: '$arena.city', else: '$city' } } }
      },
      { $match: lastFilter },
    ]

    const aggregateQuery = Event.aggregate(pipeline)

    const result = await Event.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: sort || { date: -1 },
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
    const { team } = req.user
    await validateId(_id)

    const result = await Event.findOne({ _id, team, deletedAt: null }).populate(populate).lean()
    if (!result) throw new CError(`Събитие с такъв идентификационен номер не съществува!`)
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const edit = async (req, res) => {
  try {
    const { body } = req
    const { _id } = req.params
    const { team } = req.user
    await validateId(_id)

    const checkEvent = await Event.findOne({ _id, team, deletedAt: null }).select('type homeTeam visitorTeam').lean()
    if (!checkEvent) throw new CError(`Събитие с такъв идентификационен номер не съществува!`)

    const { type } = checkEvent

    const oldTeams = {
      homeTeam: checkEvent.homeTeam?.toString(),
      visitorTeam: checkEvent.visitorTeam?.toString()
    }

    if (type === 'game') {
      const validate = gameValidator.validate(body, false)
      if (!validate.success) throw new CError(validate.errors)
      if (body.homeTeam && body.visitorTeam) {
        if (body.homeTeam !== team.toString() && body.visitorTeam !== team.toString()) throw new CError(`Единият от отборите трябва да е вашият!`)
        if (body.homeTeam === body.visitorTeam) throw new CError(`Двата отбора трябва да бъдат различни!`)
      } else if (body.homeTeam || body.visitorTeam) {
        if (body.homeTeam) oldTeams.homeTeam = body.homeTeam
        if (body.visitorTeam) oldTeams.visitorTeam = body.visitorTeam
        if (oldTeams.homeTeam !== team.toString() && oldTeams.visitorTeam !== team.toString()) throw new CError(`Единият от отборите трябва да е вашият!`)
        if (oldTeams.homeTeam === oldTeams.visitorTeam) throw new CError(`Двата отбора трябва да бъдат различни!`)
      }
    } else if (type === 'training') {
      const validate = trainingValidator.validate(body, false)
      if (!validate.success) throw new CError(validate.errors)
    } else {
      const validate = otherEventValidator.validate(body, false)
      if (!validate.success) throw new CError(validate.errors)
    }

    const result = await Event.findOneAndUpdate({ _id, team, deletedAt: null }, { ...body, team, type }, { new: true, runValidators: true }).populate(populate).lean()

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

    const result = await Event.findOneAndUpdate({ _id, team, deletedAt: null },{ deletedAt: new Date() }, { new: true, runValidators: true }).populate(populate).lean()
    if (!result) throw new CError(`Събитие с такъв идентификационен номер не съществува!`)
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const filterData = async (req, res) => {
  try {

    const pipeline = [
      { $match: { deletedAt: null } },
      {
        $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
            pipeline: [
              { $project: { _id: 1, name: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'arenas',
            localField: 'arena',
            foreignField: '_id',
            as: 'arena',
            pipeline: [
              {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city',
                    pipeline: [
                      { $project: { _id: 1, name: 1 } }
                    ]
                }
              },
              { $unwind: '$city' },
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      { $unwind: { path: '$arena', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: 1,
          arena: '$arena._id',
          homeTeam: 1,
          visitorTeam: 1,
          createdBy: 1,
          city: { $cond: { if: { $ne: ['$type', 'other'] }, then: '$arena.city._id', else: '$city._id' } } }
      },
      {
        $group: {
          _id: 0,
          type: { $addToSet: '$type' },
          arena: { $addToSet: '$arena' },
          homeTeam: { $addToSet: '$homeTeam' },
          visitorTeam: { $addToSet: '$visitorTeam' },
          createdBy: { $addToSet: '$createdBy' },
          city: { $addToSet: '$city' },
        }
      },
      {
        $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
            pipeline: [{ $project: { _id: 1, name: 1 } }]
        },
      },
      {
        $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
            pipeline: [{ $project: { _id: 1, name: 1 } }]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'homeTeam',
            foreignField: '_id',
            as: 'homeTeam',
            pipeline: [
              {
                $lookup: {
                  from: 'cities',
                  localField: 'city',
                  foreignField: '_id',
                  as: 'city',
                  pipeline: [
                    { $project: { _id: 1, name: 1 } }
                  ]
                }
              },
              { $unwind: '$city' },
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'visitorTeam',
            foreignField: '_id',
            as: 'visitorTeam',
            pipeline: [
              {
                $lookup: {
                  from: 'cities',
                  localField: 'city',
                  foreignField: '_id',
                  as: 'city',
                  pipeline: [
                    { $project: { _id: 1, name: 1 } }
                  ]
                }
              },
              { $unwind: '$city' },
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'arenas',
            localField: 'arena',
            foreignField: '_id',
            as: 'arena',
            pipeline: [{ $project: { _id: 1, name: 1 } }]
        },
      },
    ]

    const result = await Event.aggregate(pipeline)
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const publicSingleSpecial = async (req, res) => {
  try {
    const { team, option } = req.body

    const validOptions = ['last', 'next']
    if (!option) throw new CError(`Missing field 'option'`)
    if (!validOptions.includes(option)) throw new CError(`Invalid 'option'! Must be ${validOptions.join(' or ')}`)
    if (!team) throw new CError(`Missing field 'team'`)
    await validateId(team)

    const filter = { team, type: 'game', date: null }
    if (option === 'last') filter.date = { $lt: moment().add(3, 'hours').toDate() }
    if (option === 'next') filter.date = { $gt: moment().add(3, 'hours').toDate() }
    
    const populate = [
      { path: 'homeTeam', select: 'name logo', populate: { path: 'city', select: 'name' } },
      { path: 'visitorTeam', select: 'name logo', populate: { path: 'city', select: 'name' } },
      { path: 'arena', select: 'name', populate: { path: 'city', select: 'name' } },
    ]

    const sort = option === 'last' ? { date: -1 } : { date: 1 }
    const result = await Event.findOne(filter).populate(populate).sort(sort).lean()

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const publicGetByMonth = async (req, res) => {
  try {
    const { team, date } = req.body

    if (!team) throw new CError(`Missing field 'team'`)
    await validateId(team)

    const startDate = date ? moment(date).startOf('month').add(3, 'hours').toDate() : moment().startOf('month').add(3, 'hours').toDate()
    const endDate = moment(startDate).add(1, 'month').toDate()

    console.log(startDate)
    console.log(endDate)

    const filter = { date: { $gte: startDate, $lt: endDate }, deletedAt: null }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
            from: 'cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city',
            pipeline: [
              { $project: { _id: 1, name: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'arenas',
            localField: 'arena',
            foreignField: '_id',
            as: 'arena',
            pipeline: [
              {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city',
                    pipeline: [
                      { $project: { _id: 1, name: 1 } }
                    ]
                }
              },
              { $unwind: '$city' },
              { $project: { _id: 1, name: 1, city: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'homeTeam',
            foreignField: '_id',
            as: 'homeTeam',
            pipeline: [
              { $project: { _id: 1, name: 1, city: 1, logo: 1 } }
            ]
        },
      },
      {
        $lookup: {
            from: 'teams',
            localField: 'visitorTeam',
            foreignField: '_id',
            as: 'visitorTeam',
            pipeline: [
              { $project: { _id: 1, name: 1, city: 1, logo: 1 } }
            ]
        },
      },
      { $unwind: { path: '$homeTeam', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$visitorTeam', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$arena', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          type: 1,
          date: 1,
          arena: 1,
          description: 1,
          homeTeam: 1,
          visitorTeam: 1,
          firstThird: 1,
          secondThird: 1,
          thirdThird: 1,
          finalScore: 1,
          createdAt: 1,
          overtime: 1,
          city: { $cond: { if: { $ne: ['$type', 'other'] }, then: '$arena.city', else: '$city' } } }
      },
      { $addFields: { day: { $dayOfMonth: '$date' } } },
      { $group: { _id: '$day', count: { $sum: 1 }, list: { $push: '$$ROOT' } } },
      { $addFields: { day: '$_id' } },
      { $sort: { day: 1 } }
    ]

    const result = await Event.aggregate(pipeline)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
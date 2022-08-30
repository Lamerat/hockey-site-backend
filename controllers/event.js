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


export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, sort } = req.body
    const { team } = req.user
    
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
          draw: 1,
          city: { $cond: { if: { $ne: ['$type', 'other'] }, then: '$arena.city', else: '$city' } } }
      }
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
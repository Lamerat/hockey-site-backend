import News from '../models/News.js'
import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import settings from '../config/settings.js'
import { Validator } from 'body-validator-v2'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'title', type: 'String', required: true })
bodyValidator.addField({ name: 'text', type: 'String', required: true })
bodyValidator.addField({ name: 'coverPhoto.name', type: 'String', required: true })
bodyValidator.addField({ name: 'coverPhoto.address', type: 'URL', required: true })
bodyValidator.addField({ name: 'pinned', type: 'Boolean', required: false })
const photosValidator = new Validator()
photosValidator.addField({ name: 'name', type: 'String', required: true })
photosValidator.addField({ name: 'address', type: 'URL', required: true })
bodyValidator.addField({ name: 'photos', type: 'Array', options: { minRecords: 1 }, required: true, validator: photosValidator })

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { _id: createdBy, team } = req.user

    if (!body.title) throw new CError(`Missing title`, 422)

    const validate = bodyValidator.validate(body, true)
    if (!validate.success) throw new CError(validate.errors, 422)

    if (body.pinned) await News.findOneAndUpdate({ pinned: true }, { pinned: false }, {})

    const result = await News.create({ ...body, createdBy, team })
    
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
    
    const filter = { deletedAt: null, team }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              { $project: { _id: 1, name: 1 } }
            ]
        },
      },
      { $unwind: '$user' },
      { $addFields: { photosCount: { $sum : [{ $size: '$photos' }, 1] } } },
      { $project: { _id: 1, title: 1, user: 1, createdAt: 1, photosCount: 1, pinned: 1 } }
    ]

    const aggregateQuery = News.aggregate(pipeline)

    const result = await News.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: sort ? { pinned: -1, ...sort } : { pinned: -1, createdAt: -1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
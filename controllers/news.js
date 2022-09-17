import News from '../models/News.js'
import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import { Validator } from 'body-validator-v2'
import { addToNewsAlbum, ObjectId, updateNewsAlbum, validateId } from '../utilities/help-functions.js'
import moment from 'moment'
import { terminal } from '@sea_flanker/terminal'


const bodyValidator = new Validator()
bodyValidator.addField({ name: 'title', type: 'String', required: true })
bodyValidator.addField({ name: 'text', type: 'String', required: true })
bodyValidator.addField({ name: 'coverPhoto.name', type: 'String', required: true })
bodyValidator.addField({ name: 'coverPhoto.address', type: 'URL', required: true })
bodyValidator.addField({ name: 'pinned', type: 'Boolean', required: false })
const photosValidator = new Validator()
photosValidator.addField({ name: 'name', type: 'String', required: true })
photosValidator.addField({ name: 'address', type: 'URL', required: true })
bodyValidator.addField({ name: 'photos', type: 'Array', validator: photosValidator })


const listValidator = new Validator()
listValidator.addField({ name: 'pageNumber', type: 'Number', options: { min: 1 }, required: false })
listValidator.addField({ name: 'pageSize', type: 'Number', options: { min: 1 }, required: false })
listValidator.addField({ name: 'noPagination', type: 'Boolean', required: false })
listValidator.addField({ name: 'search', type: 'String', options: { minSymbols: 2, allowSpaces: true }, required: false })
listValidator.addField({ name: 'searchFields', type: 'Array', options: { arrayValuesType: 'String', arrayValuesOptions: { enum: ['text', 'title', 'author'] } }, required: false })
listValidator.addField({ name: 'startDate', type: 'Date', required: false })
listValidator.addField({ name: 'endDate', type: 'Date', required: false })


/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { _id: createdBy, team } = req.user

    if (!body.title) throw new CError(`Missing title`, 422)

    const validate = bodyValidator.validate(body, true)
    if (!validate.success) throw new CError(validate.errors, 422)

    if (body.pinned) await News.findOneAndUpdate({ pinned: true, team }, { pinned: false }, {})

    const result = await News.create({ ...body, createdBy, team })

    const photos = [ result.coverPhoto, ...result.photos ]
    addToNewsAlbum(photos, team, createdBy).catch((error) => terminal.red().log(`ERROR ADDING PHOTOS TO ALBUM NEWS: ${error.message}`))
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, sort, search, searchFields, startDate, endDate } = req.body
    const { team } = req.user

    const validate = listValidator.validate(req.body)
    if (!validate.success) throw new Error(validate.errors)
    
    const filter = { deletedAt: null, team }
    if (startDate && endDate) {
      const minDate = moment(startDate).startOf('day').add(2, 'hours').toDate()
      const maxDate = moment(endDate).endOf('day').add(3, 'hours').toDate()
      // filter.createdAt = { $gte: minDate, $lte: maxDate }
      filter.$or = [ { pinned: true }, { createdAt: { $gte: minDate, $lte: maxDate } }]
    }

    const secondFilter = {  }
    if (search && search.length) {
      if (searchFields && Array.isArray(searchFields) && searchFields.length) {
        secondFilter.$or = searchFields.map(z => z === 'author' ? 'user.name' : z).filter(s => s).map(field => ({ [field]: new RegExp(search, 'gi') }))
        secondFilter.$or.push({ pinned: true })
      } else {
        secondFilter.$or = [
          { title: new RegExp(search, 'gi') },
          { text: new RegExp(search, 'gi') },
          { 'user.name': new RegExp(search, 'gi') },
          { pinned: true },
        ]
      }
    }

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
      { $match: secondFilter },
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


/** @type { import('express').RequestHandler } */
export const single = async (req, res) => {
  try {
    const { _id } = req.params
    const { team } = req.user
    
    await validateId(_id)

    const result = await News.findOne({ _id, team, deletedAt: null }).populate({ path: 'createdBy', select: 'name' }).lean()
    if (!result) throw new CError(`Няма новина с такъв идентификационен номер!`, 404)

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
    if (!validate.success) throw new Error(validate.errors)

    const oldData = await News.findOne({ _id, team, deletedAt: null }).lean()
    if (!oldData) throw new CError(`Такава новина не съществува или нямате правомощия да я редактирате!`, 404)

    const result = await News.findOneAndUpdate({ _id, team, deletedAt: null }, { ...body, team }, { new: true, runValidators: true })
      .populate({ path: 'createdBy', select: 'name' })
      .lean()

    if (body.pinned) await News.findOneAndUpdate({ _id: { $ne: _id }, pinned: true, deletedAt: null, team }, { pinned: false }, {})

    updateNewsAlbum(oldData, result, team).catch((error) => terminal.red().log(`ERROR UPDATE NEWS ALBUM: ${error.message}`))

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

    const result = await News.findOneAndUpdate({ _id, team, deletedAt: null }, { deletedAt: new Date(), team }, { new: true, runValidators: true })
      .populate({ path: 'createdBy', select: 'name' })
      .lean()
    if (!result) throw new CError(`Такава новина не съществува или нямате правомощия да я изтриете!`, 404)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}

/** @type { import('express').RequestHandler } */
export const publicList = async (req, res) => {
  try {
    const { pageNumber, pageSize, noPagination, team, sort, search, startDate, endDate } = req.body

    if (!team) throw new CError(`Missing field team`)

    const filter = { deletedAt: null, team: ObjectId(team) }

    const other = []
    if (startDate && endDate) {
      const minDate = moment(startDate).startOf('day').add(2, 'hours').toDate()
      const maxDate = moment(endDate).endOf('day').add(3, 'hours').toDate()
      other.push( { createdAt: { $gte: minDate, $lte: maxDate } })
    }
    if (search && search.length) other.push({ $or: [{ title: new RegExp(search, 'gi') }, { text: new RegExp(search, 'gi') }] })
    if (other.length) filter.$and = other

    const aggregateQuery = News.aggregate([{ $match: filter }])

    const result = await News.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: !noPagination,
      sort: sort ? { pinned: -1, ...sort } : { pinned: -1, createdAt: -1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
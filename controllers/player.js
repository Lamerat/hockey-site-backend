import Player from '../models/Player.js'
import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import { Validator } from 'body-validator-v2'
import settings from '../config/settings.js'
import { validateId } from '../utilities/help-functions.js'
import moment from 'moment'

const bodyValidator = new Validator()
bodyValidator.addField({ name: 'firstName', type: 'String', options: { canBeEmpty: false, minSymbols: 2, maxWords: 1 }, required: true })
bodyValidator.addField({ name: 'lastName', type: 'String', options: { canBeEmpty: false, minSymbols: 2, maxWords: 1 }, required: true })
bodyValidator.addField({ name: 'number', type: 'Number', options: { min: 0, max: 99 }, required: true })
bodyValidator.addField({ name: 'position', type: 'String', options: { enum: Object.keys(settings.positions) }, required: true })
bodyValidator.addField({ name: 'hand', type: 'String', options: { enum: ['right', 'left'] }, required: false })
bodyValidator.addField({ name: 'birthDate', type: 'Date', required: false })
bodyValidator.addField({ name: 'height', type: 'Number', options: { min: 1, max: 300 }, required: false })
bodyValidator.addField({ name: 'weight', type: 'Number', options: { min: 1, max: 300 }, required: false })
bodyValidator.addField({ name: 'photo', type: 'URL', required: false })
bodyValidator.addField({ name: 'hidden', type: 'Boolean', required: false })


const formatPlayerName = (name) => name.trim()[0].toUpperCase() + name.slice(1)

/** @type { import('express').RequestHandler } */
export const create = async (req, res) => {
  try {
    const { body } = req
    const { team } = req.user

    if (!body.firstName) throw new CError(`'Missing field 'firstName'`)
    if (!body.lastName) throw new CError(`'Missing field 'lastName'`)
    if (!body.number) throw new CError(`'Missing field 'number'`)
    if (!body.position) throw new CError(`'Missing field 'position'`)
    const validate = bodyValidator.validate(body, true)
    if (!validate.success) throw new CError(validate.errors)

    body.firstName = formatPlayerName(body.firstName)
    body.lastName = formatPlayerName(body.lastName)

    const checkForExists = await Player.findOne({ number: body.number, team }).lean()
    if (checkForExists) throw new CError(`В отбора вече има играч с номер ${body.number} - ${checkForExists.firstName } ${checkForExists.lastName}`)
    
    const result = await Player.create({ ...body, team })

    rest.successRes(res, result, 201)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { search, position, hand, startDate, endDate, minNumber, maxNumber, hidden, pageNumber, pageSize, noPagination, sort } = req.body
    const { team } = req.user
    
    const filter = { deletedAt: null, team, $or: [{ hidden: false }, { hidden }] }
    const secondFilter = {}
    
    if (position && Array.isArray(position) && position.length) filter.position = { $in: position }
    if (hand) filter.hand = hand
    if (startDate && endDate) {
      const minDate = moment(startDate).startOf('day').add(2, 'hours').toDate()
      const maxDate = moment(endDate).endOf('day').add(3, 'hours').toDate()
      filter.birthDate = { $gte: minDate, $lte: maxDate }
    }
    if (minNumber && !maxNumber) filter.number = { $gte: Number(minNumber), $lte: 99 }
    if (maxNumber && !minNumber) filter.number = { $gte: 1, $lte: Number(maxNumber) }
    if (minNumber && maxNumber) {
      if (Number(minNumber) > Number(maxNumber)) throw new CError(`Max number must be greater or equal from Min number!`)
      filter.number = { $gte: Number(minNumber), $lte: Number(maxNumber) }
    }

    if (search && search.trim().length ) secondFilter.fullName = new RegExp(search, 'gi')

    const pipeline = [
      { $match: filter },
      {
        $project: {
          _id: 1,
          fullName: { $concat: ['$firstName', ' ', '$lastName'] },
          number: '$number',
          position: '$position',
          hand: '$hand',
          birthDate: '$birthDate',
          height: '$height',
          weight: '$weight',
          photo: '$photo',
          description: '$description',
          hidden: '$hidden'
        }
      },
      { $match: secondFilter }
    ]

    const aggregateQuery = Player.aggregate(pipeline)

    const result = await Player.aggregatePaginate(aggregateQuery, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: sort || { number: 1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
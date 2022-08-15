import mongoose from 'mongoose'
import CError from './CError.js'

export const validateId = (id) => mongoose.isValidObjectId(id) ? Promise.resolve() : Promise.reject(new CError(`${id} is invalid Mongodb id!`))
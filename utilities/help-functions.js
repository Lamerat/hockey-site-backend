import mongoose from 'mongoose'
import Album from '../models/Album.js'
import Photo from '../models/Photo.js'
import CError from './CError.js'

export const validateId = (id) => mongoose.isValidObjectId(id) ? Promise.resolve() : Promise.reject(new CError(`${id} is invalid Mongodb id!`))

export const addToNewsAlbum = async (photos, team, createdBy) => {
  try {
    const newsAlbum = await Album.findOne({ locked: true, team }).lean()
    if (!newsAlbum) throw new CError(`Cannot find news album`, 404)
    const album = newsAlbum._id
    
    await Photo.updateMany({ album, deletedAt: null }, { $inc: { position: photos.length } })
    await Promise.all(photos.map((image, index) => Photo.create({ album, team, createdBy, address: image.address, position: index })))
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  }
}


export const updateNewsAlbum = async (oldPhotos, newPhotos, team) => {
  try {
    const newsAlbum = await Album.findOne({ locked: true, team }).lean()
    if (!newsAlbum) throw new CError(`Cannot find news album`, 404)
    const album = newsAlbum._id
    const { createdBy } = oldPhotos

    const old = [ oldPhotos.coverPhoto, ...oldPhotos.photos].map(x => x.name)
    const newArray = [ newPhotos.coverPhoto, ...newPhotos.photos].filter(x => !old.includes(x.name))

    if (newArray.length) {
      await Photo.updateMany({ album, team, deletedAt: null }, { $inc: { position: newArray.length } })
      await Promise.all(newArray.map((image, index) => Photo.create({ album, team, createdBy, address: image.address, position: index })))
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  }
}
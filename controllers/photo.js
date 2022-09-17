import Photo from '../models/Photo.js'
import Album from '../models/Album.js'
import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import got from 'got'
import FormData from 'form-data'
import { validateId } from '../utilities/help-functions.js'

/** @type { import('express').RequestHandler } */
export const upload = async (req, res) => {
  try {
    const { album } = req.body
    const { images } = req.files
    const { _id: createdBy, team } = req.user

    if (!album) throw new CError(`Missing field 'album'!`)
    if (!images) throw new CError(`Не е подаден файл!`)
    await validateId(album)


    const requests = []

    if (Array.isArray(images)) {
      images.forEach(x => requests.push({ data: x.data, mimetype: x.mimetype, original_name: x.name}))
    } else {
      requests.push({ data: images.data, mimetype: images.mimetype, original_name: images.name})
    }

    if (requests.some(x => !x.mimetype.startsWith('image'))) throw new CError('Invalid file format', 406)
    
    const files = await Promise.all(requests.map(async file => {
      const formData = new FormData()
      formData.append('key', '6d207e02198a847aa98d0a2a901485a5')
      formData.append('format', 'json')
      formData.append('source', Buffer.from(file.data).toString('base64'))
      return got.post('https://freeimage.host/api/1/upload', { body: formData, responseType: 'json' })
    }))

    const filesData = files.map(x => x.body.image.image)

    await Photo.updateMany({ album, team }, { $inc: { position: filesData.length } })
    const result = await Promise.all(filesData.map((image, index) => Photo.create({ album, team, createdBy, address: image.url, position: index })))
    
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const list = async (req, res) => {
  try {
    const { album, pageNumber, pageSize, noPagination } = req.body
    const { team } = req.user

    if (!album) throw new CError(`Missing field 'album'!`)
    await validateId(album)

    const result = await Photo.paginate({ album, team, deletedAt: null }, {
      page: pageNumber || 1,
      limit: pageSize || 10,
      pagination: noPagination ? false : true,
      sort: { position: 1 },
      lean: true,
    })

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const updatePositions = async (req, res) => {
  try {
    const { photos } = req.body
    const { team } = req.user

    if (!photos || !Array.isArray(photos) || !photos.length) throw new CError(`Missing or invalid field 'photos'!`)

    const result = await Promise.all(photos.map(photo => Photo.findOneAndUpdate({ _id: photo._id, team }, { position: photo.position }, {})))

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const updateName = async (req, res) => {
  try {
    const { _id, name } = req.body
    const { team } = req.user

    if (!_id) throw new CError(`Missing field '_id`)
    if (!name) throw new CError(`Missing field 'name'`)
    await validateId(_id)

    const result = await Photo.findOneAndUpdate({ _id, team, deletedAt: null }, { name }, { new: true, runValidators: true }).lean()
    if (!result) throw new CError(`Снимка с такъв идентификационен номер не съществува!`)

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

    const result = await Photo.findOneAndUpdate({ _id, team, deletedAt: null }, { deletedAt: new Date() }, { new: true, runValidators: true }).lean()
    if (!result) throw new CError(`Снимка с такъв идентификационен номер не съществува!`)

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}


/** @type { import('express').RequestHandler } */
export const changeAlbum = async (req, res) => {
  try {
    const { photo, album } = req.body
    const { team } = req.user

    if (!photo) throw new CError(`Missing field 'photo`)
    if (!album) throw new CError(`Missing field 'album`)
    await Promise.all([photo, album].map(x => validateId(x)))

    const checkAlbum = await Album.findOne({ _id: album, team, deletedAt: null }).lean()
    if (!checkAlbum) throw new CError(`Албум с такъв идентификационен номер не съществува!`)

    const result = await Photo.findOneAndUpdate({ _id: photo, album: { $ne: album }, team, deletedAt: null }, { album, position: 0 }, { new: true, runValidators: true }).lean()
    if (!result) throw new CError(`Снимка с такъв идентификационен номер не съществува!`)

    await Photo.updateMany({ _id: { $ne: photo }, album, deletedAt: null }, { $inc: { position: 1 } })
    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
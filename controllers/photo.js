import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import got from 'got'
import FormData from 'form-data'
import { validateId } from '../utilities/help-functions.js'
import Photo from '../models/Photo.js'

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
      images.forEach(x => requests.push({ data: x.data, original_name: x.name}))
    } else {
      requests.push({ data: images.data, original_name: images.name})
    }
    
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

    const result = await Photo.paginate({ album, team }, {
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
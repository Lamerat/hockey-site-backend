import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import got from 'got'
import FormData from 'form-data'
import { nanoid } from 'nanoid'

/** @type { import('express').RequestHandler } */
export const upload = async (req, res) => {
  try {
    const { images } = req.files
    if (!images) throw new CError(`Не е подаден файл!`)

    const requests = []

    if (Array.isArray(images)) {
      images.forEach(x => requests.push({ data: x.data, mimetype: x.mimetype, original_name: x.name}))
    } else {
      requests.push({ data: images.data, mimetype: images.mimetype, original_name: images.name})
    }

    if (requests.some(x => !x.mimetype.startsWith('image'))) throw new CError('Invalid file format', 406)
    
    const result = await Promise.all(requests.map(async file => {
      const formData = new FormData()
      formData.append('key', '6d207e02198a847aa98d0a2a901485a5')
      formData.append('format', 'json')
      formData.append('source', Buffer(file.data).toString('base64'))
      const uploaded = await got.post('https://freeimage.host/api/1/upload', { body: formData, responseType: 'json' })
      return { ...uploaded.body.image.image, _id: nanoid(), originalName: file.original_name }
    }))

    rest.successRes(res, result)
  } catch (error) {
    error.code = 406
    rest.errorRes(res, error)
  }
}
import * as rest from '../utilities/express-helpers.js'
import CError from '../utilities/CError.js'
import got from 'got'
import FormData from 'form-data'

/** @type { import('express').RequestHandler } */
export const upload = async (req, res) => {
  try {
    const { images } = req.files
    if (!images) throw new CError(`Не е подаден файл!`)

    const requests = []

    if (Array.isArray(images)) {
      images.forEach(x => requests.push((x.data)))
    } else {
      requests.push(images.data)
    }
    
    const result = await Promise.all(requests.map(async file => {
      const formData = new FormData()
      formData.append('key', '6d207e02198a847aa98d0a2a901485a5')
      formData.append('format', 'json')
      formData.append('source', Buffer(file).toString('base64'))
      const uploaded = await got.post('https://freeimage.host/api/1/upload', { body: formData, responseType: 'json' })
      return uploaded.body.image.image
    }))

    rest.successRes(res, result)
  } catch (error) {
    rest.errorRes(res, error)
  }
}
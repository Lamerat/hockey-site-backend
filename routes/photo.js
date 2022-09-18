import express from 'express'
import * as controller from '../controllers/photo.js'
import authentication from '../middleware/authentication.js'
import fileUpload from 'express-fileupload'

const router = express.Router()

router.post('/upload', authentication, fileUpload({ createParentPath: true }), controller.upload)
router.post('/list', authentication, controller.list)
router.put('/positions', authentication, controller.updatePositions)
router.put('/name', authentication, controller.updateName)
router.put('/move', authentication, controller.changeAlbum)
router.delete('/:_id', authentication, controller.remove)

router.post('/public/list', controller.publicList)

export default router
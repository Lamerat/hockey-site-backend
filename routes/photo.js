import express from 'express'
import * as controller from '../controllers/photo.js'
import authentication from '../middleware/authentication.js'
import fileUpload from 'express-fileupload'

const router = express.Router()

router.post('/upload', authentication, fileUpload({ createParentPath: true }), controller.upload)
router.post('/list', authentication, controller.list)
router.put('/positions', authentication, controller.updatePositions)

export default router
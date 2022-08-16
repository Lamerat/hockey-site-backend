import express from 'express'
import * as controller from '../controllers/files.js'
import authentication from '../middleware/authentication.js'
import fileUpload from 'express-fileupload'

const router = express.Router()

router.post('/upload', authentication, fileUpload({ createParentPath: true }), controller.upload)


export default router
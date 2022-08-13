import express from 'express'
import * as controller from '../controllers/user.js'
const router = express.Router()

router.post('/register', controller.register)

export default router
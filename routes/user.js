import express from 'express'
import * as controller from '../controllers/user.js'
const router = express.Router()

router.post('/login', controller.login)
router.post('/create', controller.create)

export default router
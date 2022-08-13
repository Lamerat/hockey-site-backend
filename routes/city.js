import express from 'express'
import * as controller from '../controllers/city.js'
import authentication from '../middleware/authentication.js'
const router = express.Router()

router.post('/create', authentication, controller.create)
router.get('/:_id', authentication, controller.single)
router.post('/list', authentication, controller.list)

export default router
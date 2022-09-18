import express from 'express'
import * as controller from '../controllers/event.js'
import authentication from '../middleware/authentication.js'
const router = express.Router()

router.post('/create', authentication, controller.create)
router.post('/list', authentication, controller.list)
router.get('/filter', authentication, controller.filterData)
router.get('/:_id', authentication, controller.single)
router.put('/:_id', authentication, controller.edit)
router.delete('/:_id', authentication, controller.remove)

router.post('/public/special', controller.publicSingleSpecial)

export default router
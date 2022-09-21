import express from 'express'
import * as controller from '../controllers/player.js'
import authentication from '../middleware/authentication.js'
const router = express.Router()

router.post('/create', authentication, controller.create)
router.post('/list', authentication, controller.list)
router.get('/:_id', authentication, controller.single)
router.put('/:_id', authentication, controller.edit)
router.delete('/:_id', authentication, controller.remove)

router.post('/public/list', controller.publicList)
router.post('/public/stat', controller.averageStat)
router.get('/public/:_id', controller.publicSingle)

export default router
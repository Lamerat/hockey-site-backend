import express from 'express'
import * as controller from '../controllers/user.js'
const router = express.Router()
import authentication from '../middleware/authentication.js'

router.post('/login', controller.login)
router.post('/create', authentication, controller.create)
router.get('/profile', authentication, controller.userProfile)
router.put('/edit', authentication, controller.editProfile)
router.put('/password', authentication, controller.changePassword)

export default router
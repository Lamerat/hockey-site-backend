import express from 'express'
import * as controller from '../controllers/team.js'
const router = express.Router()

router.post('/create', controller.create)

export default router
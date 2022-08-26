import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import settings from '../config/settings.js'

const positionsEnum = Object.keys(settings.positions)


const playerSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: [true, `Missing 'firstName'`] },
    lastName: { type: String, trim: true, required: [true, `Missing 'firstName'`] },
    number: { type: Number, min: 0, max: 99, required: [true, `Missing 'number'`] },
    position: { type: String, trim: true, required: [true, `Missing 'position'`], enum: positionsEnum },
    hand: { type: String, trim: true, enum: ['right', 'left'], default: 'right' },
    birthDate: { type: Date, default: null },
    height: { type: Number, min: 1, max: 300, default: null },
    weight: { type: Number, min: 1, max: 300, default: null },
    photo: { type: String, trim: true, default: null },
    description: { type: String, trim: true, default: null },

    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team', required: [true, `Missing 'team'!`] },
    hidden: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

playerSchema.index({ createdAt: 1 })
playerSchema.index({ updatedAt: 1 })
playerSchema.index({ number: 1, team: 1 }, { unique: true })

playerSchema.plugin(aggregatePaginate)

const Player = mongoose.model('Player', playerSchema)

export default Player
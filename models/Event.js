import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const scoreSchema = new mongoose.Schema(
  {
    home: { type: Number, default: null },
    visitor: { type: Number, default: null },
  },
  {  _id: false, timestamps: false, strict: true }
)


const eventSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, required: [true, `Missing 'type'`], enum: ['game', 'training', 'other'] },
    date: { type: Date, required: [true, `Missing 'date'`] },
    arena: { type: mongoose.SchemaTypes.ObjectId, ref: 'Arena' }, // for game or training
    city: { type: mongoose.SchemaTypes.ObjectId, ref: 'City' }, // for other type
    description: { type: String, trim: true },

    homeTeam: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
    visitorTeam: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
    firstThird: { type: scoreSchema, default: () => ({}) },
    secondThird: { type: scoreSchema, default: () => ({}) },
    thirdThird: { type: scoreSchema, default: () => ({}) },
    finalScore: { type: scoreSchema, default: () => ({}) },
    overtime: { type: String, trim: true, enum: ['draw', 'overtime', 'penalties', null] },
    
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team', required: [true, `Missing 'team'!`] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

eventSchema.index({ createdAt: 1 })
eventSchema.index({ updatedAt: 1 })

eventSchema.plugin(aggregatePaginate)

const Event = mongoose.model('Event', eventSchema)

export default Event
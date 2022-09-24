import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const infoSchema = new mongoose.Schema(
  {
    shortTitle: { type: String, trim: true, required: [true, `Missing 'shortTitle'`] },
    longTitle: { type: String, trim: true, required: [true, `Missing 'longTitle'`] },
    text: { type: String, trim: true, required: [true, `Missing 'text'`] },
    position: { type: Number, min: 0, required: [true, `Missing 'position'`] },

    locked: { type: Boolean, default: false },
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team', required: [true, `Missing 'team'!`] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

infoSchema.index({ team: 1, shortTitle: 1 }, { unique: true })

infoSchema.index({ createdAt: 1 })
infoSchema.index({ updatedAt: 1 })
infoSchema.plugin(mongoosePaginate)

const Info = mongoose.model('Info', infoSchema)

export default Info
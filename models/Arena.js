import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
const arenaEnum = ['system', 'personal']

const arenaSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, `Missing 'name'`] },
    city: { type: mongoose.SchemaTypes.ObjectId, ref: 'City', required: [true, `Missing 'city'`] },
    type: { type: String, trim: true, enum: arenaEnum, default: arenaEnum[1] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
    shared: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

arenaSchema.index({ createdAt: 1 })
arenaSchema.index({ updatedAt: 1 })
arenaSchema.plugin(aggregatePaginate)

const Arena = mongoose.model('Arena', arenaSchema)

export default Arena
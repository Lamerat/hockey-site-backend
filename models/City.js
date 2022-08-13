import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
const cityEnum = ['system', 'personal']

const citySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, `Missing 'name'`] },
    type: { type: String, trim: true, enum: cityEnum, default: cityEnum[1] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    shared: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

citySchema.index({ createdAt: 1 })
citySchema.index({ updatedAt: 1 })
citySchema.plugin(mongoosePaginate)

const City = mongoose.model('City', citySchema)

export default City
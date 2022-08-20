import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const photosSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, `Missing 'photos.name'!`], index: true },
    address: { type: String, required: [true, `Missing 'photos.address'!`], index: true },
  },
  { _id: true, timestamps: false, strict: true }
)

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, `Missing 'title'!`], index: true, trim: true },
    text: { type: String, required: [true, `Missing 'text'!`], index: true },
    coverPhoto: { type: photosSchema, required: [true, `Missing 'coverPhoto'!`], index: true },
    photos: [{ type: photosSchema }],
    pinned: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: [true, `Missing 'createdBy'!`] },
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team', required: [true, `Missing 'team'!`] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

newsSchema.index({ createdAt: 1 })
newsSchema.index({ updatedAt: 1 })

newsSchema.plugin(aggregatePaginate)
const News = mongoose.model('News', newsSchema)

export default News

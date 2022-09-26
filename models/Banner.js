import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const bannerSchema = new mongoose.Schema(
  {
    position: { type: Number, min: 0, required: [true, `Missing 'position'`] },
    photo: { type: String, trim: true, default: null },
    link: { type: String, trim: true, required: [true, `Missing 'link'`] },
    text: { type: String, trim: true, required: [true, `Missing 'text'`] },
    
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

bannerSchema.index({ createdAt: 1 })
bannerSchema.index({ updatedAt: 1 })
bannerSchema.plugin(aggregatePaginate)

const Banner = mongoose.model('Banner', bannerSchema)

export default Banner
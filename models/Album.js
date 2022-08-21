import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'


const albumSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, `Missing 'name'`] },
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team', required: [true, `Missing 'team'!`] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
    locked: { type: Boolean, default: false },
    main: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

albumSchema.index({ createdAt: 1 })
albumSchema.index({ updatedAt: 1 })
albumSchema.index({ name: 1, team: 1 }, { unique: true })

albumSchema.plugin(aggregatePaginate)

const Album = mongoose.model('Album', albumSchema)

export default Album
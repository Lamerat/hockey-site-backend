import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'


const photoSchema = new mongoose.Schema(
  {
    album: { type: mongoose.SchemaTypes.ObjectId, ref: 'Album', required: [true, `Missing 'album'!`] },
    name: { type: String, trim: true },
    address: { type: String, trim: true, required: [true, `Missing 'address'`] },
    position: { type: Number, min: 0, default: 0 },
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

photoSchema.plugin(mongoosePaginate)

const Photo = mongoose.model('Photo', photoSchema)

export default Photo
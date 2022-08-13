import mongoose from 'mongoose'
const teamEnum = ['system', 'personal']

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, `Missing 'name'`] },
    city: { type: mongoose.SchemaTypes.ObjectId, ref: 'City', required: [true, `Missing 'city'`] },
    logo: { type: String, trim: true, default: null },
    type: { type: String, trim: true, enum: teamEnum, default: teamEnum[1] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
    shared: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

const Team = mongoose.model('Team', teamSchema)

export default Team
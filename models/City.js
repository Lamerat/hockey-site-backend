import mongoose from 'mongoose'
const cityEnum = ['system', 'personal']

const citySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    type: { type: String, trim: true, enum: cityEnum, default: cityEnum[1] },
    createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    shared: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

const City = mongoose.model('City', citySchema)

export default City
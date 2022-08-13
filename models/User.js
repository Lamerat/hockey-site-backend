import mongoose from 'mongoose'
import { generateHashedPassword } from '../utilities/encryption.js'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: [ true, `Missing field 'name'` ], unique: true, trim: true },
    password: { type: String },
    salt: { type: String },
    name: { type: String, required: [ true, `Missing field 'name'` ] },
    tokenDate: { type: Date, default: new Date() }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

userSchema.method({
  authenticate: function (password) {
    return generateHashedPassword(this.salt, password) === this.password
  }
})

const User = mongoose.model('User', userSchema)

export default User
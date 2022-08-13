import mongoose from 'mongoose'
import { generateHashedPassword } from '../utilities/encryption.js'
import settings from '../config/settings.js'

const roleEnum = Object.keys(settings.roles)

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: [ true, `Missing field 'email'` ], unique: true, trim: true },
    name: { type: String, required: [ true, `Missing field 'name'` ] },
    password: { type: String },
    salt: { type: String },
    tokenDate: { type: Date, default: new Date() },
    teams: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Team' }],
    role: { type: String, enum: roleEnum, default: settings.roles.user },
    deletedAt: { type: Date, default: null },
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
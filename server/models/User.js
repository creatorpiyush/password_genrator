import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    salt: {
      type: String,
      required: true,
    },
    authKeyHash: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    providerId: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    lastLoginTime: {
      type: Date,
      default: Date.now,
    },
    lastLoginDevice: {
      type: String,
      default: 'Unknown Device',
    },
    activeSessions: [
      {
        deviceId: String,
        deviceName: String,
        ipAddress: String,
        lastActiveAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);

import mongoose from 'mongoose';

const EncryptedItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    applicationName: { type: String, required: true },
    applicationUsername: { type: String, required: true },
    encryptedPassword: {
      iv: { type: String, required: true },
      ciphertext: { type: String, required: true },
    },
    category: {
      type: String,
      enum: ['web', 'banking', 'social', 'work', 'other'],
      default: 'web',
    },
    notes: { type: String },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
  },
  { _id: false }
);

const VaultSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    encryptedItems: [EncryptedItemSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);

import mongoose from 'mongoose';

const ShareSchema = new mongoose.Schema(
  {
    shareId: { type: String, required: true, unique: true, index: true },
    encryptedPayload: {
      iv: { type: String, required: true },
      ciphertext: { type: String, required: true },
    },
    maxViews: { type: Number, default: 1 },
    viewsCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 }, // TTL index auto-deletes expired records
  },
  { timestamps: true }
);

const ShareModel = mongoose.models.Share || mongoose.model('Share', ShareSchema);

// In-Memory Fallback Store when MongoDB is offline
const memoryShareStore = new Map();

export const ShareRepository = {
  async createShare(shareId, encryptedPayload, maxViews = 1, expireHours = 24) {
    const expiresAt = new Date(Date.now() + expireHours * 60 * 60 * 1000);

    if (mongoose.connection.readyState === 1) {
      return await ShareModel.create({
        shareId,
        encryptedPayload,
        maxViews,
        viewsCount: 0,
        expiresAt,
      });
    }

    const record = {
      shareId,
      encryptedPayload,
      maxViews,
      viewsCount: 0,
      expiresAt,
      createdAt: new Date(),
    };
    memoryShareStore.set(shareId, record);
    return record;
  },

  async getAndConsumeShare(shareId) {
    if (mongoose.connection.readyState === 1) {
      const doc = await ShareModel.findOne({ shareId });
      if (!doc) return null;

      if (new Date() > doc.expiresAt) {
        await ShareModel.deleteOne({ shareId });
        return null;
      }

      doc.viewsCount += 1;
      const result = {
        encryptedPayload: doc.encryptedPayload,
        viewsLeft: Math.max(0, doc.maxViews - doc.viewsCount),
        expiresAt: doc.expiresAt,
      };

      if (doc.viewsCount >= doc.maxViews) {
        await ShareModel.deleteOne({ shareId });
      } else {
        await doc.save();
      }

      return result;
    }

    // In-memory lookup
    const record = memoryShareStore.get(shareId);
    if (!record) return null;

    if (new Date() > record.expiresAt) {
      memoryShareStore.delete(shareId);
      return null;
    }

    record.viewsCount += 1;
    const result = {
      encryptedPayload: record.encryptedPayload,
      viewsLeft: Math.max(0, record.maxViews - record.viewsCount),
      expiresAt: record.expiresAt,
    };

    if (record.viewsCount >= record.maxViews) {
      memoryShareStore.delete(shareId);
    }

    return result;
  },
};

export default ShareModel;

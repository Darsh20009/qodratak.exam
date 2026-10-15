import mongoose, { Schema } from "mongoose";

const adminVideoAssetSchema = new Schema(
  {
    videoNumber: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    originalFilename: { type: String, required: true, maxlength: 255 },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    objectKey: { type: String, required: true, unique: true },
    uploadedBy: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { versionKey: false },
);

const adminVideoCounterSchema = new Schema(
  { _id: String, sequence: { type: Number, required: true, default: 0 } },
  { versionKey: false },
);

export const AdminVideoAsset =
  mongoose.models.AdminVideoAsset || mongoose.model("AdminVideoAsset", adminVideoAssetSchema);

export const AdminVideoCounter =
  mongoose.models.AdminVideoCounter || mongoose.model("AdminVideoCounter", adminVideoCounterSchema);

import mongoose, { Schema } from "mongoose";

const contractSchema = new Schema({
  reference: { type: String, required: true },
  issuedAt: { type: Date, required: true },
  issuerName: { type: String, required: true },
  issuerLegalName: { type: String, required: true },
  issuerPlatformName: String,
  signatureAssetId: String,
  signatureSha256: String,
  stampAssetId: String,
  stampSha256: String,
  issuerNationalNumber: { type: String, required: true },
  issuedBy: { type: String, required: true },
  policies: { type: String, required: true },
  conditions: { type: [String], required: true },
  digest: { type: String, required: true },
  status: { type: String, enum: ["issued", "submitted", "approved", "rejected"], default: "issued" },
  signedObjectKey: String,
  signedSha256: String,
  signedBytes: Number,
  signedUploadedAt: Date,
  signedUploadedBy: String,
  approvedAt: Date,
  approvedBy: String,
  rejectionReason: String,
  issuedObjectKey: String,
  issuedSha256: String,
  issuedBytes: Number,
  portalSentAt: Date,
  portalDeliveryStatus: String,
}, { _id: false });

const memberSchema = new Schema({
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["student", "teacher", "institution_admin"], required: true },
  nameAtJoin: String,
  status: { type: String, enum: ["active", "revoked"], default: "active" },
  revokedAt: Date,
  teacherIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  joinedAt: { type: Date, required: true },
  freeStartDate: { type: Date, required: true },
  freeEndDate: { type: Date, required: true },
}, { timestamps: true });
// A student's institution grant cannot be restarted by reusing an invitation.
memberSchema.index({ userId: 1 }, { unique: true });

const inviteSchema = new Schema({
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
  role: { type: String, enum: ["student", "teacher", "institution_admin"], required: true },
  codeHash: { type: String, required: true, unique: true },
  hint: String,
  boundPhone: String,
  label: String,
  maxUses: { type: Number, required: true },
  uses: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  createdBy: String,
}, { timestamps: true });

export const InstitutionMember = mongoose.models.InstitutionMember ||
  mongoose.model("InstitutionMember", memberSchema);
export const InstitutionInvite = mongoose.models.InstitutionInvite ||
  mongoose.model("InstitutionInvite", inviteSchema);
export { contractSchema };

const deliverySchema = new Schema({
  institutionId: { type: Schema.Types.ObjectId, required: true, index: true },
  reference: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true },
  sealedToken: { type: Buffer, required: true, select: false },
  targetPhone: String,
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
}, { timestamps: true });
export const InstitutionContractDelivery = mongoose.models.InstitutionContractDelivery ||
  mongoose.model("InstitutionContractDelivery", deliverySchema);

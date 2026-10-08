import mongoose, { Schema, type Document } from 'mongoose';

export type VerbalVideoProgressState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface VerbalVideoWatchRange {
  startSeconds: number;
  endSeconds: number;
}

export interface IVerbalVideoProgress extends Document {
  studentId: string;
  videoId: string;
  durationSeconds: number;
  watchedRanges: VerbalVideoWatchRange[];
  resumePositionSeconds: number;
  lastPositionSeconds: number;
  lastHeartbeatAt?: Date;
  wasPlaying: boolean;
  state: VerbalVideoProgressState;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verbalVideoWatchRangeSchema = new Schema<VerbalVideoWatchRange>(
  {
    startSeconds: { type: Number, required: true, min: 0 },
    endSeconds: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const verbalVideoProgressSchema = new Schema<IVerbalVideoProgress>(
  {
    studentId: { type: String, required: true, trim: true },
    videoId: { type: String, required: true, trim: true, maxlength: 80 },
    durationSeconds: { type: Number, required: true, min: 1 },
    watchedRanges: { type: [verbalVideoWatchRangeSchema], default: [] },
    resumePositionSeconds: { type: Number, required: true, min: 0, default: 0 },
    lastPositionSeconds: { type: Number, required: true, min: 0, default: 0 },
    lastHeartbeatAt: { type: Date },
    wasPlaying: { type: Boolean, required: true, default: false },
    state: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      required: true,
      default: 'NOT_STARTED',
    },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'qudrat_verbal_video_progress',
  },
);

verbalVideoProgressSchema.index({ studentId: 1, videoId: 1 }, { unique: true });

export const VerbalVideoProgressModel =
  (mongoose.models.QudratVerbalVideoProgress as mongoose.Model<IVerbalVideoProgress> | undefined) ??
  mongoose.model<IVerbalVideoProgress>('QudratVerbalVideoProgress', verbalVideoProgressSchema);

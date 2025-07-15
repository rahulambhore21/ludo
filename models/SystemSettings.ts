import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['maintenance', 'match_config', 'notification']
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

export interface ISystemSettings extends mongoose.Document {
  type: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

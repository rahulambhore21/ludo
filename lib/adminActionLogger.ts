import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Admin Action Log Schema
const AdminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

export const AdminAction = mongoose.models.AdminAction || mongoose.model('AdminAction', AdminActionSchema);

// Helper function to log admin actions
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: any = {}
) {
  try {
    await dbConnect();
    
    await AdminAction.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date(),
    });
    
    console.log(`Admin action logged: ${action} by ${adminId} on ${targetType}:${targetId}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

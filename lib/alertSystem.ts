import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Alert Schema
const AlertSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['error', 'warning', 'info'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['system', 'bet', 'match', 'user', 'payment'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
});

export const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);

// Helper function to create alerts (can be used by other parts of the system)
export async function createAlert(
  type: 'error' | 'warning' | 'info',
  category: 'system' | 'bet' | 'match' | 'user' | 'payment',
  title: string,
  message: string,
  details: any = {}
) {
  try {
    await dbConnect();
    
    const alert = new Alert({
      type,
      category,
      title,
      message,
      details,
      createdAt: new Date(),
    });
    
    await alert.save();
    console.log(`Alert created: ${type.toUpperCase()} - ${title}`);
    
    return alert;
  } catch (error) {
    console.error('Failed to create alert:', error);
    return null;
  }
}

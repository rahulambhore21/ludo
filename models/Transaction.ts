import mongoose from 'mongoose';

export interface ITransaction extends mongoose.Document {
  userId?: mongoose.Types.ObjectId; // Optional for system transactions
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl?: string; // only for deposit
  upiId?: string; // only for withdrawal
  description?: string; // For match transactions, etc.
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new mongoose.Schema<ITransaction>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for system transactions
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: [true, 'Transaction type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be positive'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  proofUrl: {
    type: String,
    required: function(this: ITransaction) {
      return this.type === 'deposit' && this.userId; // Only required for user deposits
    },
  },
  upiId: {
    type: String,
    required: function(this: ITransaction) {
      return this.type === 'withdrawal' && this.userId; // Only required for user withdrawals
    },
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
TransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Prevent model re-compilation during development
export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

import mongoose from 'mongoose';

export interface IMatch extends mongoose.Document {
  player1: mongoose.Types.ObjectId;
  player2?: mongoose.Types.ObjectId;
  entryFee: number;
  pot: number; // 2 * entryFee
  platformCut: number; // 10% of pot
  roomCode: string;
  player1Result?: 'win' | 'loss';
  player2Result?: 'win' | 'loss';
  winner?: mongoose.Types.ObjectId;
  status: 'waiting' | 'in-progress' | 'completed' | 'conflict';
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new mongoose.Schema<IMatch>({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player 1 is required'],
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  entryFee: {
    type: Number,
    required: [true, 'Entry fee is required'],
    min: [1, 'Entry fee must be at least 1 coin'],
  },
  pot: {
    type: Number,
    required: [true, 'Pot is required'],
  },
  platformCut: {
    type: Number,
    required: [true, 'Platform cut is required'],
  },
  roomCode: {
    type: String,
    required: [true, 'Room code is required'],
    trim: true,
  },
  player1Result: {
    type: String,
    enum: ['win', 'loss'],
  },
  player2Result: {
    type: String,
    enum: ['win', 'loss'],
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'conflict'],
    default: 'waiting',
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
MatchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
MatchSchema.index({ status: 1, createdAt: -1 });
MatchSchema.index({ player1: 1 });
MatchSchema.index({ player2: 1 });

// Prevent model re-compilation during development
export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

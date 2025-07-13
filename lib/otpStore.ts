// OTP store that works in both development and production
import dbConnect from '@/lib/mongodb';
import OTP from '@/models/OTP';

interface OTPData {
  otp: string;
  phone: string;
  name: string;
  referredBy?: string; // ObjectId as string
  expiresAt: Date;
}

class OTPStore {
  private memoryStore: Map<string, OTPData> = new Map();
  private useDatabase = process.env.NODE_ENV === 'production';

  async set(phone: string, otp: string, name: string, referredBy?: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    if (this.useDatabase) {
      try {
        await dbConnect();
        
        // Remove any existing OTP for this phone
        await OTP.deleteMany({ phone });
        
        // Create new OTP record
        await OTP.create({
          phone,
          otp,
          name,
          referredBy: referredBy || undefined,
          expiresAt,
        });
      } catch (error) {
        console.error('Error storing OTP in database:', error);
        // Fallback to memory store
        this.memoryStore.set(phone, { otp, phone, name, referredBy, expiresAt });
      }
    } else {
      this.memoryStore.set(phone, { otp, phone, name, referredBy, expiresAt });
    }
  }

  async get(phone: string): Promise<OTPData | null> {
    if (this.useDatabase) {
      try {
        await dbConnect();
        
        const otpRecord = await OTP.findOne({ 
          phone,
          expiresAt: { $gt: new Date() }
        });
        
        if (!otpRecord) return null;
        
        return {
          otp: otpRecord.otp,
          phone: otpRecord.phone,
          name: otpRecord.name,
          referredBy: otpRecord.referredBy?.toString(),
          expiresAt: otpRecord.expiresAt,
        };
      } catch (error) {
        console.error('Error retrieving OTP from database:', error);
        // Fallback to memory store
        return this.memoryStore.get(phone) || null;
      }
    } else {
      const data = this.memoryStore.get(phone);
      if (!data) return null;
      
      if (new Date() > data.expiresAt) {
        this.memoryStore.delete(phone);
        return null;
      }
      
      return data;
    }
  }

  async delete(phone: string): Promise<void> {
    if (this.useDatabase) {
      try {
        await dbConnect();
        await OTP.deleteMany({ phone });
      } catch (error) {
        console.error('Error deleting OTP from database:', error);
      }
    } else {
      this.memoryStore.delete(phone);
    }
  }

  // Clean expired OTPs (mainly for memory store, database has TTL)
  cleanup(): void {
    if (!this.useDatabase) {
      const now = new Date();
      for (const [phone, data] of this.memoryStore.entries()) {
        if (now > data.expiresAt) {
          this.memoryStore.delete(phone);
        }
      }
    }
  }
}

export const otpStore = new OTPStore();

// Clean up expired OTPs every 10 minutes (for memory store)
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    otpStore.cleanup();
  }, 10 * 60 * 1000);
}

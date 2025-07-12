// Simple in-memory OTP store for development
// In production, use Redis or a proper cache

interface OTPData {
  otp: string;
  phone: string;
  name: string;
  expiresAt: Date;
}

class OTPStore {
  private store: Map<string, OTPData> = new Map();

  set(phone: string, otp: string, name: string): void {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.store.set(phone, { otp, phone, name, expiresAt });
  }

  get(phone: string): OTPData | null {
    const data = this.store.get(phone);
    if (!data) return null;
    
    if (new Date() > data.expiresAt) {
      this.store.delete(phone);
      return null;
    }
    
    return data;
  }

  delete(phone: string): void {
    this.store.delete(phone);
  }

  // Clean expired OTPs
  cleanup(): void {
    const now = new Date();
    for (const [phone, data] of this.store.entries()) {
      if (now > data.expiresAt) {
        this.store.delete(phone);
      }
    }
  }
}

export const otpStore = new OTPStore();

// Clean up expired OTPs every 10 minutes
setInterval(() => {
  otpStore.cleanup();
}, 10 * 60 * 1000);

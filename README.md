# Ludo Game - OTP Authentication System

A full-stack OTP-based authentication system built with Next.js, MongoDB, and JWT.

## Features

- 📱 **OTP-based Authentication**: Secure phone number verification
- 🔐 **JWT Token Management**: Stateless authentication
- 📊 **User Dashboard**: Display user information and balance
- 🛡️ **Protected Routes**: Middleware-based route protection
- 🎨 **Modern UI**: Clean Tailwind CSS design

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ludo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/ludo
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Authentication Flow

1. **Registration**: Enter your name and phone number
2. **OTP Verification**: Enter the 6-digit OTP (use `123456` for development)
3. **Dashboard**: Access your personalized dashboard

### Development OTP

For development purposes, the OTP is hardcoded as `123456`. In production, integrate with an SMS service like Twilio, AWS SNS, or similar.

## API Routes

### Authentication

- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register

### Protected Routes

- `GET /api/protected/profile` - Get user profile (requires JWT token)

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── send-otp/route.ts
│   │   └── verify-otp/route.ts
│   └── protected/
│       └── profile/route.ts
├── auth/
│   ├── register/page.tsx
│   └── verify-otp/page.tsx
├── dashboard/page.tsx
├── globals.css
├── layout.tsx
└── page.tsx
lib/
├── auth.ts
├── jwt.ts
├── mongodb.ts
└── otpStore.ts
models/
└── User.ts
middleware.ts
```

## Database Schema

### User Model

```typescript
{
  name: string;        // User's full name
  phone: string;       // Phone number (unique)
  isAdmin: boolean;    // Admin status (default: false)
  balance: number;     // Coin balance (default: 0)
  createdAt: Date;     // Registration timestamp
}
```

## Security Features

- 🔒 **JWT Authentication**: Secure token-based auth
- ⏰ **OTP Expiry**: OTPs expire after 5 minutes
- 🛡️ **Route Protection**: Middleware-based protection
- 🔐 **Environment Variables**: Sensitive data secured

## Production Considerations

1. **SMS Service**: Replace dummy OTP with real SMS service
2. **Rate Limiting**: Implement OTP request rate limiting
3. **Database**: Use MongoDB Atlas or proper production database
4. **Security**: Update JWT_SECRET and use strong secrets
5. **Caching**: Use Redis for OTP storage instead of in-memory
6. **Error Handling**: Enhanced error handling and logging

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

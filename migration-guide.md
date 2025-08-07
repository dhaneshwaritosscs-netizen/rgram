# Express.js to Next.js Migration Guide

This guide will help you migrate your existing Express.js R-GRAM application to Next.js.

## 🎯 Migration Overview

### What's Being Migrated
- **Backend**: Express.js routes → Next.js API routes
- **Frontend**: No frontend → Complete React frontend
- **Database**: MongoDB + Mongoose (unchanged)
- **Authentication**: JWT-based (enhanced)
- **File Structure**: Reorganized for Next.js conventions

## 📋 Pre-Migration Checklist

### 1. Backup Your Current Application
```bash
# Create a backup of your current Express.js app
cp -r your-express-app your-express-app-backup
```

### 2. Verify Dependencies
Ensure you have the required versions:
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 3. Environment Variables
Copy your existing environment variables and update them for Next.js:
```bash
cp .env .env.local
```

## 🚀 Step-by-Step Migration

### Step 1: Create New Next.js Project Structure

1. **Create the new directory structure**:
```bash
mkdir rgram-nextjs
cd rgram-nextjs
```

2. **Copy the provided files**:
- `package.json` → `nextjs-package.json`
- `next.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`

3. **Install dependencies**:
```bash
npm install
```

### Step 2: Database Migration

1. **Copy your existing models**:
```bash
# Copy from Express app
cp -r ../your-express-app/models ./lib/models
```

2. **Update model imports** (if needed):
```typescript
// Old Express.js
const mongoose = require('mongoose');

// New Next.js
import mongoose, { Document, Schema } from 'mongoose';
```

3. **Test database connection**:
```bash
npm run dev
# Check console for database connection status
```

### Step 3: API Routes Migration

1. **Create API routes structure**:
```bash
mkdir -p pages/api/auth
mkdir -p pages/api/user
mkdir -p pages/api/posts
```

2. **Migrate Express routes to Next.js API routes**:

#### Express Route → Next.js API Route
```javascript
// Old Express.js (routes/authRoutes.js)
router.post('/signup', authController.signup);

// New Next.js (pages/api/auth/signup.ts)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  // Your signup logic here
}
```

3. **Update middleware usage**:
```typescript
// Old Express.js
router.get('/user', protect, userController.getProfile);

// New Next.js
export default async function handler(req, res) {
  await protect(req, res, async () => {
    // Your logic here
  });
}
```

### Step 4: Frontend Development

1. **Create the app directory structure**:
```bash
mkdir -p app/auth/login
mkdir -p app/auth/signup
mkdir -p app/dashboard
```

2. **Copy the provided frontend files**:
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/dashboard/page.tsx`

### Step 5: Environment Configuration

1. **Update environment variables**:
```env
# Add Next.js specific variables
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Update existing variables if needed
MONGODB_URI=mongodb://localhost:27017/rgram
JWT_SECRET=your-super-secret-jwt-key-here
```

### Step 6: Testing

1. **Test API endpoints**:
```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Test frontend pages**:
- Visit `http://localhost:3000` (landing page)
- Visit `http://localhost:3000/auth/signup` (signup page)
- Visit `http://localhost:3000/auth/login` (login page)

## 🔄 Migration Mapping

### File Structure Mapping

| Express.js | Next.js |
|------------|---------|
| `routes/authRoutes.js` | `pages/api/auth/signup.ts` |
| `routes/userRoutes.js` | `pages/api/user/[id].ts` |
| `routes/postRoutes.js` | `pages/api/posts/index.ts` |
| `controllers/authController.js` | Logic in API route handlers |
| `middleware/authMiddleware.js` | `lib/middleware/auth.ts` |
| `models/User.js` | `lib/models/User.ts` |
| `config/database.js` | `lib/database.ts` |
| `public/` | `public/` |
| No frontend | `app/` directory |

### Route Mapping

| Express Route | Next.js API Route |
|---------------|-------------------|
| `POST /api/v1/auth/signup` | `POST /api/auth/signup` |
| `POST /api/v1/auth/login` | `POST /api/auth/login` |
| `GET /api/v1/auth/user` | `GET /api/auth/user` |
| `POST /api/v1/auth/otp/send` | `POST /api/auth/otp/send` |
| `POST /api/v1/auth/otp/verify` | `POST /api/auth/otp/verify` |

## 🛠️ Common Migration Issues

### 1. Import/Export Issues
**Problem**: CommonJS vs ES Modules
```javascript
// Old Express.js
const express = require('express');
module.exports = router;

// New Next.js
import { NextApiRequest, NextApiResponse } from 'next';
export default function handler(req, res) {}
```

### 2. Middleware Adaptation
**Problem**: Express middleware doesn't work in Next.js
```typescript
// Solution: Create Next.js compatible middleware
export const protect = async (req, res, next) => {
  // Your authentication logic
  next();
};
```

### 3. File Upload Handling
**Problem**: Multer doesn't work in Next.js API routes
```typescript
// Solution: Use Next.js compatible file upload
import formidable from 'formidable';
// or use Cloudinary directly
```

### 4. CORS Issues
**Problem**: CORS configuration in Next.js
```javascript
// Solution: Configure in next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        // ... other headers
      ],
    },
  ];
}
```

## ✅ Post-Migration Checklist

### 1. Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] JWT authentication works
- [ ] OTP sending works
- [ ] OTP verification works
- [ ] User profile retrieval works
- [ ] Database connections work
- [ ] Email sending works

### 2. Frontend Testing
- [ ] Landing page loads
- [ ] Signup form works
- [ ] Login form works
- [ ] Dashboard loads
- [ ] Responsive design works
- [ ] Animations work
- [ ] Form validation works

### 3. Performance Testing
- [ ] API response times
- [ ] Page load times
- [ ] Database query performance
- [ ] Image loading performance

### 4. Security Testing
- [ ] JWT token validation
- [ ] Password hashing
- [ ] Input validation
- [ ] CORS configuration
- [ ] Rate limiting (if implemented)

## 🚀 Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Test Production Build
```bash
npm run start
```

### 3. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 4. Set Environment Variables
Configure your production environment variables in your hosting platform.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check MongoDB URI
   - Verify network connectivity
   - Check authentication credentials

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **Email Sending Issues**
   - Check SMTP configuration
   - Verify email credentials
   - Check firewall settings

4. **Build Issues**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check import/export syntax

### Getting Help

1. Check the console for error messages
2. Review the Next.js documentation
3. Check the migration logs
4. Create an issue in the repository

---

**Migration Complete!** 🎉

Your Express.js application has been successfully migrated to Next.js. The new application provides both backend API functionality and a modern React frontend, all in a single, cohesive application. 
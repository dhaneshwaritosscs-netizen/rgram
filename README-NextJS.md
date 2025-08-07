# R-GRAM Next.js Migration

This is the complete Next.js migration of the R-GRAM Express.js backend application. The application has been converted from a traditional Express.js backend to a full-stack Next.js application with both frontend and backend capabilities.

## 🚀 Features

### Backend (API Routes)
- **Authentication System**: JWT-based authentication with signup, login, and user management
- **OTP Verification**: Email-based OTP for account verification and password reset
- **User Management**: Complete user CRUD operations with profile management
- **Database Integration**: MongoDB with Mongoose ODM
- **Email Services**: Nodemailer integration for transactional emails
- **File Upload**: Cloudinary integration for image and video uploads
- **Security**: JWT tokens, password hashing, input validation

### Frontend (React/Next.js)
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Authentication Pages**: Login and signup forms with validation
- **Dashboard**: User dashboard with feed, profile, and post creation
- **Animations**: Smooth animations using Framer Motion
- **Responsive Design**: Mobile-first approach
- **Toast Notifications**: User feedback with react-hot-toast

## 📁 Project Structure

```
rgram-nextjs/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/                         # Utility libraries
│   ├── database.ts              # MongoDB connection
│   ├── middleware/              # Authentication middleware
│   ├── models/                  # Mongoose models
│   └── utils/                   # Utility functions
├── pages/                       # API routes
│   └── api/                     # Backend API endpoints
│       └── auth/                # Authentication endpoints
├── components/                  # React components (to be added)
├── types/                       # TypeScript types (to be added)
├── public/                      # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Hook Form**: Form handling
- **React Hot Toast**: Toast notifications
- **Heroicons**: Icon library

### Backend
- **Next.js API Routes**: Backend API endpoints
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Nodemailer**: Email services
- **Cloudinary**: File upload service
- **Speakeasy**: OTP generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rgram-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/rgram
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXTAUTH_SECRET=your-nextauth-secret-here
   NEXTAUTH_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user (protected)
- `POST /api/auth/otp/send` - Send OTP
- `POST /api/auth/otp/verify` - Verify OTP

### User Management (to be implemented)
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/avatar` - Upload avatar

### Posts (to be implemented)
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Structure
- **API Routes**: Located in `pages/api/`
- **Pages**: Located in `app/`
- **Components**: Located in `components/`
- **Models**: Located in `lib/models/`
- **Utilities**: Located in `lib/utils/`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Form validation and sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Rate Limiting**: API rate limiting (to be implemented)
- **Helmet**: Security headers (to be implemented)

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 UI/UX Features

- **Modern Design**: Clean, modern interface
- **Smooth Animations**: Framer Motion animations
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Form Validation**: Real-time form validation

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Static site hosting
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting
- **AWS**: Cloud hosting

## 🔄 Migration Notes

### From Express.js to Next.js
- **Routes**: Express routes converted to Next.js API routes
- **Middleware**: Express middleware converted to Next.js middleware
- **Models**: Mongoose models remain largely unchanged
- **Controllers**: Logic moved to API route handlers
- **Static Files**: Moved to Next.js public directory
- **Frontend**: Complete React frontend added

### Key Changes
1. **File Structure**: Reorganized for Next.js conventions
2. **API Routes**: Moved from Express routes to `/pages/api/`
3. **Authentication**: JWT tokens with Next.js API routes
4. **Frontend**: Added complete React frontend
5. **Styling**: Migrated to Tailwind CSS
6. **TypeScript**: Added type safety throughout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Video upload support
- [ ] Advanced search functionality
- [ ] User following system
- [ ] Comment system
- [ ] Like/unlike posts
- [ ] Share posts
- [ ] Direct messaging
- [ ] Push notifications
- [ ] Progressive Web App (PWA)
- [ ] Dark mode
- [ ] Internationalization (i18n)
- [ ] Advanced analytics
- [ ] Admin dashboard
- [ ] Content moderation
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Performance optimization

---

**R-GRAM Next.js** - Connecting hearts through faith and spirituality ✨🙏 
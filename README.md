# R-GRAM API - FREE VERSION 🌟

A complete Instagram-like social media API focused on spiritual/religious content, built with Node.js, Express, and MongoDB. **100% FREE** - No paid services required!

## 🚀 Features

### ✨ Core Features
- **User Authentication**: JWT-based auth with email OTP verification
- **User Profiles**: Complete profile management with avatar uploads
- **Posts & Reels**: Create, like, comment, share, and save content
- **Social Features**: Follow/unfollow users, view followers/following
- **Search & Explore**: Search users, explore posts, trending hashtags
- **Privacy Settings**: Private accounts, customizable privacy options
- **File Uploads**: Local file storage (images, videos, avatars)
- **Real-time Notifications**: Email-based notifications

### 🔒 Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers

### 📱 Platform Support
- **Web Applications**: React, Vue, Angular
- **Mobile Apps**: React Native, Flutter, Native iOS/Android
- **Cross-platform**: RESTful API design

## 🛠️ Tech Stack (FREE)

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database (MongoDB Atlas FREE tier)
- **Mongoose** - MongoDB ODM

### Authentication & Security
- **JWT** - JSON Web Tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting

### File Storage (FREE)
- **Local Storage** - Files stored on server
- **Multer** - File upload handling
- **Static File Serving** - Direct file access

### Email Services (FREE)
- **Nodemailer** - Email sending
- **Gmail SMTP** - Free email service
- **Speakeasy** - OTP generation

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB Atlas** account (FREE tier)
- **Gmail account** (for email OTP)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Rgram
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas (FREE)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rgram?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=30d

# Email Configuration (Gmail - FREE)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@rgram.com

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
```

### 4. Setup Gmail App Password
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password for "Mail"
4. Use this password in `EMAIL_PASS`

### 5. Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "username": "johndoe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Send OTP
```http
POST /auth/otp/send
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "signup"
}
```

#### Verify OTP
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "purpose": "signup"
}
```

### User Endpoints

#### Get User Profile
```http
GET /user/:id
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /user/:id/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "bio": "Spiritual seeker",
  "website": "https://example.com",
  "location": "New York"
}
```

#### Upload Avatar
```http
PUT /user/:id/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: [image file]
```

#### Follow/Unfollow User
```http
POST /user/:id/follow
POST /user/:id/unfollow
Authorization: Bearer <token>
```

### Post Endpoints

#### Create Post
```http
POST /post/create
Authorization: Bearer <token>
Content-Type: multipart/form-data

media: [image files]
caption: "Beautiful spiritual moment"
location: "Temple"
tags: ["spiritual", "meditation"]
isPrivate: false
```

#### Get Feed
```http
GET /post/all?page=1&limit=10
Authorization: Bearer <token>
```

#### Like/Unlike Post
```http
PUT /post/:id/like
PUT /post/:id/unlike
Authorization: Bearer <token>
```

#### Add Comment
```http
POST /post/:id/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Beautiful post!"
}
```

### Reel Endpoints

#### Create Reel
```http
POST /reel/create
Authorization: Bearer <token>
Content-Type: multipart/form-data

video: [video file]
caption: "Spiritual dance"
duration: 30
tags: ["dance", "spiritual"]
```

#### Get Trending Reels
```http
GET /reel/all?page=1&limit=10
```

### Search Endpoints

#### Search Users
```http
GET /search/users?q=john&type=users
Authorization: Bearer <token>
```

#### Explore Posts
```http
GET /search/explore?page=1&limit=10
Authorization: Bearer <token>
```

### Settings Endpoints

#### Update Privacy Settings
```http
PUT /settings/privacy
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPrivate": false,
  "allowComments": true,
  "allowLikes": true,
  "allowFollows": true
}
```

#### Change Password
```http
PUT /settings/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String,
  password: String,
  username: String,
  fullName: String,
  avatar: { url: String, filename: String },
  bio: String,
  website: String,
  location: String,
  isPrivate: Boolean,
  isVerified: Boolean,
  followersCount: Number,
  followingCount: Number,
  postsCount: Number
}
```

### Post Model
```javascript
{
  user: ObjectId,
  caption: String,
  media: [{
    url: String,
    filename: String,
    type: String,
    size: Number
  }],
  location: String,
  tags: [String],
  likes: [ObjectId],
  comments: [ObjectId],
  shares: Number,
  isPrivate: Boolean
}
```

### Reel Model
```javascript
{
  user: ObjectId,
  caption: String,
  video: {
    url: String,
    filename: String,
    type: String,
    size: Number,
    duration: Number
  },
  location: String,
  tags: [String],
  likes: [ObjectId],
  comments: [ObjectId],
  views: Number,
  isPrivate: Boolean
}
```

## 🚀 Deployment

### Render (FREE)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Railway (FREE)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy with one click

### Vercel (FREE)
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy serverless functions

### Heroku (FREE tier discontinued)
Use alternatives like Render or Railway

## 📱 Mobile App Integration

### Flutter Example
```dart
// Login
final response = await http.post(
  Uri.parse('https://your-api.com/api/v1/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: json.encode({
    'email': 'user@example.com',
    'password': 'password123'
  }),
);

final token = json.decode(response.body)['data']['token'];
```

### React Native Example
```javascript
// Create post
const formData = new FormData();
formData.append('media', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'post.jpg'
});
formData.append('caption', 'Beautiful spiritual moment');

const response = await fetch('https://your-api.com/api/v1/post/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```

## 🔧 Configuration

### File Upload Limits
- **Images**: 10MB per file
- **Videos**: 100MB per file
- **Avatars**: 5MB per file

### Rate Limiting
- **Default**: 100 requests per 15 minutes
- **Configurable** via environment variables

### Email Settings
- **SMTP**: Gmail (free)
- **OTP Expiry**: 10 minutes
- **Welcome emails**: Automatic

## 🧪 Testing

### Using Postman
1. Import the provided Postman collection
2. Set up environment variables
3. Test all endpoints

### Using cURL
```bash
# Test health endpoint
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create GitHub issues
- **Email**: support@rgram.com

## 🎯 Roadmap

- [ ] Real-time notifications (WebSocket)
- [ ] Video processing
- [ ] Advanced search filters
- [ ] User blocking
- [ ] Content moderation
- [ ] Analytics dashboard

## 🙏 Acknowledgments

- Built with ❤️ for the spiritual community
- Inspired by Instagram's design
- Powered by free and open-source technologies

---

**R-GRAM** - Connecting souls through spiritual content 🌟

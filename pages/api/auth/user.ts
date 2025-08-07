import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/database';
import User from '../../../lib/models/User';
import { protect, AuthenticatedRequest } from '../../../lib/middleware/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Apply authentication middleware
    await new Promise<void>((resolve, reject) => {
      protect(req as AuthenticatedRequest, res, () => {
        resolve();
      });
    });

    const authenticatedReq = req as AuthenticatedRequest;
    
    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(authenticatedReq.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          isPrivate: user.isPrivate,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          reelsCount: user.reelsCount,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
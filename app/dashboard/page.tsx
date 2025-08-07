'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  UserIcon, 
  HeartIcon, 
  BellIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: {
    url: string;
  };
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setUser(result.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                R-GRAM
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <CogIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={user.avatar.url}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-gray-600 text-sm mb-6">{user.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{user.postsCount}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{user.followersCount}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{user.followingCount}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
              </div>

              <nav className="space-y-2">
                <a href="#" className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 text-blue-700">
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  <HeartIcon className="h-5 w-5" />
                  <span>Saved</span>
                </a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6 mb-8"
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={user.avatar.url}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    placeholder="Share your spiritual insights..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <PhotoIcon className="h-5 w-5" />
                    <span>Photo</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <VideoCameraIcon className="h-5 w-5" />
                    <span>Video</span>
                  </button>
                </div>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Post</span>
                </button>
              </div>
            </motion.div>

            {/* Feed */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">John Doe</h3>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">
                  "Faith is taking the first step even when you don't see the whole staircase." 
                  - Martin Luther King Jr.
                </p>
                
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
                  alt="Post"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600">
                    <HeartIcon className="h-5 w-5" />
                    <span>24</span>
                  </button>
                  <button className="text-gray-600 hover:text-blue-600">Comment</button>
                  <button className="text-gray-600 hover:text-green-600">Share</button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">Jane Smith</h3>
                    <p className="text-sm text-gray-500">5 hours ago</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">
                  Today's meditation reminded me that every challenge is an opportunity for growth. 
                  Grateful for this spiritual journey. 🙏✨
                </p>
                
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600">
                    <HeartIcon className="h-5 w-5" />
                    <span>18</span>
                  </button>
                  <button className="text-gray-600 hover:text-blue-600">Comment</button>
                  <button className="text-gray-600 hover:text-green-600">Share</button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  User, 
  Settings, 
  LogOut, 
  Users, 
  Heart, 
  MessageCircle, 
  Share,
  Plus,
  Search,
  Home,
  Bell
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  interests: string[];
  is_verified: boolean;
}

export function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (user) {
      // Mock profile data for demo
      setProfile({
        id: user.id,
        username: user.user_metadata?.username || 'user123',
        first_name: user.user_metadata?.first_name || 'Demo',
        last_name: user.user_metadata?.last_name || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        bio: 'Welcome to my profile! 🚀',
        followers_count: 42,
        following_count: 128,
        posts_count: 15,
        interests: user.user_metadata?.interests || ['music', 'movies'],
        is_verified: false
      });
      setProfileLoading(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center liquid-glass">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background liquid-glass">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b liquid-glass">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">SocialApp</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative liquid-glass">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
            <Button variant="ghost" size="icon" className="liquid-glass">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Stories */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              <div className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-blue-500 liquid-glass">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center liquid-glass">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-xs text-center">Your Story</span>
              </div>
              {/* Mock stories */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                  <Avatar className="w-16 h-16 border-2 border-gray-300 liquid-glass">
                    <AvatarFallback>U{i + 1}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center">User {i + 1}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Posts */}
            <div className="space-y-4">
              {/* Mock posts */}
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="liquid-glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 liquid-glass">
                          <AvatarFallback>U{i + 1}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">user_{i + 1}</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="liquid-glass">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3">This is a sample post content for the social media app! 🚀</p>
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center liquid-glass">
                      <span className="text-muted-foreground">Image Placeholder</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="gap-2 liquid-glass">
                          <Heart className="w-4 h-4" />
                          <span>24</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 liquid-glass">
                          <MessageCircle className="w-4 h-4" />
                          <span>5</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="liquid-glass">
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <div className="p-4 space-y-6">
            {/* Profile Header */}
            <div className="text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto liquid-glass">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="text-xs liquid-glass">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm mt-2 max-w-sm mx-auto">{profile.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="font-bold text-lg">{profile.posts_count}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{profile.followers_count}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{profile.following_count}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Interests</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs liquid-glass">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="flex-1 max-w-32 liquid-glass">
                  Edit Profile
                </Button>
                <Button variant="outline" size="icon" className="liquid-glass">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSignOut} className="liquid-glass">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Posts Grid */}
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center liquid-glass">
                  <span className="text-xs text-muted-foreground">Post {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t liquid-glass">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={activeTab === 'home' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActiveTab('home')}
            className="flex-col h-12 w-12 liquid-glass"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-12 w-12 liquid-glass"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-12 w-12 liquid-glass"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-col h-12 w-12 liquid-glass"
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActiveTab('profile')}
            className="flex-col h-12 w-12 liquid-glass"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
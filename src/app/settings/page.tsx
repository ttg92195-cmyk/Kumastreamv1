'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/movie/Header';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, Moon, Bell, Download, Shield, HelpCircle, Info, Trash2, Palette, User, LogOut, Heart, Star, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

// Theme colors with names - Added 4 more colors
const themeColors = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Yellow', value: '#eab308' },
  // New colors
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
];

interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  action?: 'toggle' | 'link' | 'button';
  href?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
  danger?: boolean;
  themeColor?: string;
}

function SettingsItem({
  icon: Icon,
  label,
  description,
  action,
  href,
  checked,
  onCheckedChange,
  onClick,
  danger,
  themeColor,
}: SettingsItemProps) {
  const content = (
    <div className={cn(
      "flex items-center justify-between py-4 border-b border-gray-800",
      danger && "hover:bg-red-500/10 -mx-4 px-4"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center",
          danger && "bg-red-500/20"
        )}>
          <Icon className={cn("w-5 h-5", danger ? "text-red-500" : "text-gray-400")} />
        </div>
        <div>
          <p className={cn("text-sm", danger ? "text-red-500" : "text-white")}>{label}</p>
          {description && (
            <p className="text-gray-500 text-xs mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action === 'toggle' && (
        <Switch 
          checked={checked} 
          onCheckedChange={onCheckedChange}
          style={{ '--theme-color': themeColor || '#ef4444' } as React.CSSProperties}
        />
      )}
      {action === 'link' && (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
      {action === 'button' && (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
}

export default function SettingsPage() {
  const router = useRouter();
  const { admin, logoutAdmin, _hasHydrated: appHydrated } = useAppStore();
  const { 
    themeColor, 
    setThemeColor, 
    notificationsEnabled,
    setNotificationsEnabled,
    downloadNotifications,
    setDownloadNotifications,
    _hasHydrated: settingsHydrated 
  } = useSettingsStore();
  
  const [darkMode, setDarkMode] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Request notification permission
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    if (checked && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Clear all data
      localStorage.clear();
      logoutAdmin();
      router.push('/');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push('/');
  };

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Settings" showSearch={false} />

      <div className="p-4">
        {/* Theme Color */}
        <section className="mb-6">
          <h2 className="text-gray-500 text-xs font-medium mb-2 uppercase">
            Theme
          </h2>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-gray-400" />
                <span className="text-white text-sm">Theme Color</span>
              </div>
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="w-8 h-8 rounded-full border-2 border-white/20 ring-2 ring-offset-2 ring-offset-[#0f0f0f]"
                style={{ backgroundColor: themeColor, '--tw-ring-color': themeColor } as React.CSSProperties}
              />
            </div>
            
            {showThemePicker && (
              <div className="pt-3 border-t border-gray-700 space-y-4">
                {/* Color Grid */}
                <div className="grid grid-cols-6 gap-3">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleThemeChange(color.value)}
                      className={cn(
                        "w-full aspect-square rounded-lg flex items-center justify-center transition-transform",
                        themeColor === color.value && "ring-2 ring-white scale-110"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {themeColor === color.value && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Theme Preview */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <p className="text-gray-400 text-xs font-medium">Preview</p>
                  
                  {/* Preview Card */}
                  <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                    {/* Preview Header */}
                    <div className="h-20 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-end gap-2">
                        <div className="w-12 h-16 bg-gray-600 rounded shadow-lg flex items-center justify-center">
                          <Play className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">Sample Movie</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>2024</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" style={{ color: themeColor, fill: themeColor }} />
                              <span>8.5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview Actions */}
                    <div className="p-3 flex items-center gap-2">
                      <button 
                        className="flex-1 py-2 text-white text-xs font-medium rounded-lg"
                        style={{ backgroundColor: themeColor }}
                      >
                        Watch Now
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${themeColor}20` }}
                      >
                        <Heart className="w-5 h-5" style={{ color: themeColor }} />
                      </button>
                    </div>
                    
                    {/* Preview Tags */}
                    <div className="px-3 pb-3 flex gap-2">
                      <span 
                        className="px-2 py-0.5 text-xs rounded"
                        style={{ backgroundColor: `${themeColor}30`, color: themeColor }}
                      >
                        4K
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-600 text-gray-300">
                        Action
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-600 text-gray-300">
                        Drama
                      </span>
                    </div>
                  </div>
                  
                  {/* Color Name Display */}
                  <div className="text-center">
                    <span className="text-gray-400 text-xs">
                      Selected: <span style={{ color: themeColor }}>{themeColors.find(c => c.value === themeColor)?.name || 'Custom'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <SettingsItem
            icon={Moon}
            label="Dark Mode"
            description="Enable dark theme"
            action="toggle"
            checked={darkMode}
            onCheckedChange={setDarkMode}
            themeColor={themeColor}
          />
        </section>

        {/* Notifications */}
        <section className="mb-6">
          <h2 className="text-gray-500 text-xs font-medium mb-2 uppercase">
            Notifications
          </h2>
          <SettingsItem
            icon={Bell}
            label="Push Notifications"
            description="Get notified about new releases"
            action="toggle"
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationsChange}
            themeColor={themeColor}
          />
          <SettingsItem
            icon={Download}
            label="Download Notifications"
            description="Get notified when downloads complete"
            action="toggle"
            checked={downloadNotifications}
            onCheckedChange={setDownloadNotifications}
            themeColor={themeColor}
          />
        </section>

        {/* Account */}
        <section className="mb-6">
          <h2 className="text-gray-500 text-xs font-medium mb-2 uppercase">
            Account
          </h2>
          
          {appHydrated && admin ? (
            <>
              <div className="flex items-center gap-4 py-4 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{admin.username}</p>
                  <p className="text-gray-500 text-xs">Administrator</p>
                </div>
              </div>
              
              <SettingsItem
                icon={Shield}
                label="Admin Dashboard"
                description="Manage your content"
                action="link"
                href="/admin/dashboard"
              />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 py-4 border-b border-gray-800"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-white text-sm">Logout</span>
              </button>
              
              <SettingsItem
                icon={Trash2}
                label="Delete Account"
                description="Permanently delete your account and all data"
                action="button"
                onClick={handleDeleteAccount}
                danger
              />
            </>
          ) : (
            <SettingsItem
              icon={Shield}
              label="Admin Login"
              description="Login as admin to manage content"
              action="link"
              href="/admin/login"
            />
          )}
        </section>

        {/* About */}
        <section className="mb-6">
          <h2 className="text-gray-500 text-xs font-medium mb-2 uppercase">
            About
          </h2>
          <SettingsItem
            icon={HelpCircle}
            label="Help & Support"
            action="link"
          />
          <SettingsItem
            icon={Info}
            label="About KUMASTREAM"
            description="Version 1.0.0"
            action="link"
          />
        </section>
      </div>
    </div>
  );
}

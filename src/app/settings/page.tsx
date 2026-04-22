'use client';

import { Header } from '@/components/movie/Header';
import { ChevronRight, Shield, HelpCircle, Info, Trash2, User, LogOut, Map } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  action?: 'toggle' | 'link' | 'button';
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsItem({
  icon: Icon,
  label,
  description,
  action,
  href,
  onClick,
  danger,
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
          <Icon className={cn("w-5 h-5", danger ? "text-red-500" : "text-gray-400")} aria-hidden="true" />
        </div>
        <div>
          <p className={cn("text-sm", danger ? "text-red-500" : "text-gray-300")}>{label}</p>
          {description && (
            <p className="text-gray-500 text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action === 'link' && (
        <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
      )}
      {action === 'button' && (
        <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
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
  
  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.clear();
      logoutAdmin();
      router.push('/');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push('/');
  };
  
  // Wait for hydration before showing admin state to prevent flash
  const showAdminState = appHydrated && admin;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Settings" showSearch={false} />

      <div className="p-4">
        <h1 className="sr-only">Settings</h1>
        {/* Account */}
        <section className="mb-6" aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-gray-300 text-sm font-medium mb-2 uppercase">
            Account
          </h2>
          
          {showAdminState ? (
            <>
              <div className="flex items-center gap-4 py-4 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500">
                  <User className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-200 text-sm">{admin?.username}</p>
                  <p className="text-gray-400 text-sm">Administrator</p>
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
                aria-label="Logout"
                className="w-full flex items-center gap-4 py-4 border-b border-gray-800"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-gray-400" aria-hidden="true" />
                </div>
                <span className="text-gray-200 text-sm">Logout</span>
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
          ) : appHydrated ? (
            <SettingsItem
              icon={Shield}
              label="Login"
              description="Login as admin to manage content"
              action="link"
              href="/admin/login"
            />
          ) : null}
        </section>

        {/* About Section */}
        <section className="mb-6" aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-gray-300 text-sm font-medium mb-2 uppercase">
            About
          </h2>
          <SettingsItem
            icon={HelpCircle}
            label="Help & Support"
            description="FAQs and contact information"
            action="link"
            href="/help"
          />
          <SettingsItem
            icon={Info}
            label="About KUMASTREAM"
            description="Version 1.0.0"
            action="link"
            href="/about"
          />
          <SettingsItem
            icon={Map}
            label="Sitemap"
            description="Browse all pages"
            action="link"
            href="/site-map"
          />
        </section>
      </div>
    </div>
  );
}

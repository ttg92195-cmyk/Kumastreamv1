import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - CINE STREAM',
  description: 'Manage your CINE STREAM settings and preferences.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

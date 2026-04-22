import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - CINE STREAM',
  description: 'Admin dashboard for CINE STREAM.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

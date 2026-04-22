import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Downloads - CINE STREAM',
  description: 'Download movies and series from CINE STREAM.',
};

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

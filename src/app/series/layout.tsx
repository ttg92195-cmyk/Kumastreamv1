import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Series - CINE STREAM',
  description: 'Browse all TV series available on CINE STREAM. Watch your favorite shows in high quality.',
};

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {children}
    </div>
  );
}

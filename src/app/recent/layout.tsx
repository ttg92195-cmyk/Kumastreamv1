import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recent - CINE STREAM',
  description: 'Your recently viewed movies and series on CINE STREAM.',
};

export default function RecentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">Recent - CINE STREAM</h1>
      {children}
    </>
  );
}

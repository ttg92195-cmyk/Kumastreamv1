import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & Support - CINE STREAM',
  description: 'Get help and support for CINE STREAM. Find answers to frequently asked questions about movies, series, and streaming.',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">Help & Support - CINE STREAM</h1>
      {children}
    </>
  );
}

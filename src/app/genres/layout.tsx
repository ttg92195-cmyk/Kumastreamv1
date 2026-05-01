import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genres & Tags - CINE STREAM',
  description: 'Browse movies and series by genre, tag, or collection on CINE STREAM.',
};

export default function GenresLayout({
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

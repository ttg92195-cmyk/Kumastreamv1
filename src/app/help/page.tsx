'use client';

import { Header } from '@/components/movie/Header';
import { 
  HelpCircle, 
  Search, 
  Film, 
  Tv, 
  Bookmark, 
  Download, 
  ChevronDown,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
  icon?: React.ElementType;
}

function FAQItem({ question, answer, icon: Icon }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-red-500" />}
          <span className="text-white text-sm font-medium">{question}</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="pb-4 pl-8">
          <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I search for movies or series?',
      answer: 'Use the search bar at the top of the home page or any content page. Type the name of the movie or series you\'re looking for, and results will appear instantly.',
      icon: Search,
    },
    {
      question: 'How do I bookmark content?',
      answer: 'Click on any movie or series poster to open its detail page. You\'ll find a bookmark icon that you can click to save it to your bookmarks. Access your bookmarks from the bottom navigation or menu.',
      icon: Bookmark,
    },
    {
      question: 'What quality options are available?',
      answer: 'We offer multiple quality options including 4K, 2K, 1080p, and 720p. Quality badges are displayed on each poster to indicate available formats.',
      icon: Film,
    },
    {
      question: 'How do I enable download links?',
      answer: 'Go to Settings and find the "Downloads" section. Toggle on "All Download Link" to show download options on movie and series pages.',
      icon: Download,
    },
    {
      question: 'What are Collections?',
      answer: 'Collections are curated groups of related movies and series, such as Marvel, DC, Harry Potter, and more. Access them from the Genres page under the Collections tab.',
      icon: Tv,
    },
    {
      question: 'How do I use TMDB Generator?',
      answer: 'Admin users can access TMDB Generator from the menu. Search for movies or series, select the ones you want, and import them to your database with one click.',
      icon: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Help & Support" showSearch={false} />

      <div className="p-4">
        <h1 className="sr-only">Help & Support</h1>

        {/* Help Header */}
        <div className="text-center py-6 border-b border-gray-800">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20 mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white font-semibold text-xl">How can we help?</h2>
          <p className="text-gray-400 text-sm mt-2">Find answers to common questions below</p>
        </div>

        {/* FAQ Section */}
        <section className="py-4">
          <h3 className="text-white font-semibold mb-2">Frequently Asked Questions</h3>
          <div className="divide-y divide-gray-800">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                icon={faq.icon}
              />
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-6 border-t border-gray-800">
          <h3 className="text-white font-semibold mb-4">Need more help?</h3>
          <div className="space-y-3">
            <a
              href="mailto:support@kumastream.com"
              className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-white text-sm font-medium">Email Support</p>
                <p className="text-gray-400 text-xs">support@kumastream.com</p>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl">
              <MessageCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-white text-sm font-medium">Community</p>
                <p className="text-gray-400 text-xs">Join our community for updates and discussions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-6 border-t border-gray-800">
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <a href="/movies" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Browse Movies
            </a>
            <a href="/series" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Browse Series
            </a>
            <a href="/genres" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Genres
            </a>
            <a href="/settings" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Settings
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

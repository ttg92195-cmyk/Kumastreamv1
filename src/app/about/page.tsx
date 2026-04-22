'use client';

import { Header } from '@/components/movie/Header';
import { Film, Tv, Star, Download, Shield, Globe, Zap, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="About" showSearch={false} />

      <div className="p-4">
        <h1 className="sr-only">About KUMASTREAM</h1>

        {/* Logo & Title */}
        <div className="text-center py-8 border-b border-gray-800">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-red-500 mx-auto mb-4">
            <span className="text-white font-bold text-4xl">C</span>
          </div>
          <h2 className="text-white font-bold text-2xl">KUMASTREAM</h2>
          <p className="text-gray-400 text-sm mt-1">Your Ultimate Streaming Destination</p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-gray-800 rounded-full">
            <span className="text-gray-400 text-xs">Version</span>
            <span className="text-white text-xs font-medium">1.0.0</span>
          </div>
        </div>

        {/* Features */}
        <section className="py-6 border-b border-gray-800">
          <h3 className="text-white font-semibold mb-4">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Film className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Movies</p>
              <p className="text-gray-400 text-xs mt-1">HD & 4K Quality</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Tv className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Series</p>
              <p className="text-gray-400 text-xs mt-1">Complete Seasons</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Download className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Downloads</p>
              <p className="text-gray-400 text-xs mt-1">Offline Viewing</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Star className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Ratings</p>
              <p className="text-gray-400 text-xs mt-1">TMDB Ratings</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Globe className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Subtitles</p>
              <p className="text-gray-400 text-xs mt-1">Myanmar Subtitle</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl">
              <Zap className="w-6 h-6 text-red-500 mb-2" />
              <p className="text-white text-sm font-medium">Fast</p>
              <p className="text-gray-400 text-xs mt-1">Quick Loading</p>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-6 border-b border-gray-800">
          <h3 className="text-white font-semibold mb-4">About</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            KUMASTREAM is a modern streaming platform designed to provide you with the best movie and TV series experience. 
            Browse through our extensive collection of content in various qualities including 4K, 2K, 1080p, and 720p.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mt-3">
            Our platform features a user-friendly interface, fast search capabilities, and the ability to bookmark your favorite content for later viewing.
          </p>
        </section>

        {/* Credits */}
        <section className="py-6">
          <h3 className="text-white font-semibold mb-4">Credits</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white text-sm">TMDB API</p>
                <p className="text-gray-400 text-xs">Movie & Series Data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-white text-sm">Open Source</p>
                <p className="text-gray-400 text-xs">Built with Next.js</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-6">
          <p className="text-gray-500 text-xs">© 2024 KUMASTREAM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

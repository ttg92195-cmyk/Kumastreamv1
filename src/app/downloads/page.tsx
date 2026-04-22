'use client';

import { Header } from '@/components/movie/Header';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/stores/settings-store';
import { Link2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DownloadsPage() {
  const { 
    showAllDownloadLinks, 
    setShowAllDownloadLinks, 
    _hasHydrated
  } = useSettingsStore();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header title="Downloads" showSearch={true} />

      <div className="p-4 pb-20">
        <h1 className="sr-only">Downloads Settings</h1>
        {/* All Download Link Toggle */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          {/* Toggle Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/15">
                <Link2 className="w-6 h-6 text-red-500" aria-hidden="true" />
              </div>
              <div>
                <Label htmlFor="download-toggle" className="text-gray-300 text-base font-semibold cursor-pointer">
                  All Download Link
                </Label>
                <p className="text-gray-500 text-sm mt-0.5">
                  Show download links on movie & series pages
                </p>
              </div>
            </div>
            <Switch
              id="download-toggle"
              checked={_hasHydrated ? showAllDownloadLinks : false}
              onCheckedChange={setShowAllDownloadLinks}
              className="scale-110"
            />
          </div>

          {/* Status Message */}
          <div 
            className={cn(
              'mt-4 p-3 rounded-lg flex items-center gap-3 transition-all',
              showAllDownloadLinks 
                ? 'bg-green-950/50 border border-green-800/50' 
                : 'bg-amber-950/50 border border-amber-800/50'
            )}
          >
            {showAllDownloadLinks ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-green-400 text-sm font-medium">Download Links Visible</p>
                  <p className="text-green-300/80 text-sm">
                    You can see download options on all pages.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-amber-400 text-sm font-medium">Download Links Hidden</p>
                  <p className="text-amber-300/80 text-sm">
                    Toggle to enable download options.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

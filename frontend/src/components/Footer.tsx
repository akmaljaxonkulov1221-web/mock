'use client';

import Link from 'next/link';
import { useSettingsStore } from '@/store/settingsStore';

export default function Footer() {
  const { settings } = useSettingsStore();
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {settings.siteLogo ? (
                <img src={settings.siteLogo} alt={settings.siteName} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{settings.siteName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold">
                <span className="gradient-text">{settings.siteName}</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-md">
              {settings.siteDescription}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/#features" className="block text-gray-400 hover:text-white transition">Features</Link>
              <Link href="/#pricing" className="block text-gray-400 hover:text-white transition">Pricing</Link>
              <Link href="/login" className="block text-gray-400 hover:text-white transition">Login</Link>
              <Link href="/register" className="block text-gray-400 hover:text-white transition">Register</Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-400 hover:text-white transition">Privacy Policy</Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition">Terms of Service</Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

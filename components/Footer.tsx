'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">🎲</div>
              <h3 className="text-xl font-bold">Ludo Game</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Experience the thrill of classic Ludo with modern features. 
              Play with friends, win rewards, and enjoy secure gaming.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">18+</span>
              <span>Skill-based gaming platform</span>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/fair-play" className="hover:text-white transition-colors">
                  Fair Play Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/legal/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/legal/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/legal/responsible-gaming" className="hover:text-white transition-colors">
                  Responsible Gaming
                </Link>
              </li>
              <li>
                <a href="mailto:support@ludogame.com" className="hover:text-white transition-colors">
                  support@ludogame.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 Ludo Game. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-400">Certified Safe Gaming</span>
              <div className="flex space-x-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">SECURE</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

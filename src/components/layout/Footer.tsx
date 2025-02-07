import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Kebab Partners. All rights reserved.
          </p>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>by Kebab Partners Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
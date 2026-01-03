'use client';

import { useEffect } from 'react';

export function LocatorInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@locator/runtime').then(({ default: setupLocatorUI }) => {
        setupLocatorUI();
      });
    }
  }, []);

  return null;
}

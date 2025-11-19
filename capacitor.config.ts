import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.connect.app',
  appName: 'connect',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none', // Disable automatic resizing completely
      style: 'dark', // Dark keyboard style
      resizeOnFullScreen: false, // Prevent full screen resize
      accessoryBarVisible: false // Remove the keyboard toolbar
    }
  },
  server: {
    androidScheme: 'https',
    // Allow all routes to be handled by the app (prevents index.txt errors)
    allowNavigation: ['*']
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.connect.app',
  appName: 'connect',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none', // Disable automatic resizing completely
      style: 'dark', // Dark keyboard style
      resizeOnFullScreen: false,
      accessoryBarVisible: false // Remove the keyboard toolbar
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.connect.app',
  appName: 'connect',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'body', // Allow body resizing for proper keyboard behavior
      style: 'dark', // Dark keyboard style
      resizeOnFullScreen: true,
      accessoryBarVisible: false // Remove the keyboard toolbar
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;

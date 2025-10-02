import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.connect.app',
  appName: 'connect',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none', // Prevent automatic viewport resizing
      style: 'dark', // Dark keyboard style
      resizeOnFullScreen: true
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;

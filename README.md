# connect - Next.js + TypeScript + Capacitor Mobile App

A modern mobile-first web application built with Next.js, TypeScript, Tailwind CSS, and Capacitor for cross-platform deployment (Web, iOS, Android).

## 🚀 Features

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS v4** for modern styling
- **Capacitor 7** for native mobile functionality
- **Responsive design** optimized for mobile and desktop
- **iOS and Android** native app support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Mobile**: Capacitor 7 with iOS/Android support
- **Icons**: Lucide React

## 📱 Getting Started

### Prerequisites

- Node.js 18+ 
- iOS development: Xcode (for iOS builds)
- Android development: Android Studio (for Android builds)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web version.

### Mobile Development

#### For iOS Development:

1. **Build the web app**:
```bash
npm run build
```

2. **Sync with iOS**:
```bash
npx cap sync ios
```

3. **Open in Xcode**:
```bash
npx cap open ios
```

4. **Run on iOS Simulator** or device through Xcode

#### For Android Development:

1. **Build the web app**:
```bash
npm run build
```

2. **Sync with Android**:
```bash
npx cap sync android
```

3. **Open in Android Studio**:
```bash
npx cap open android
```

4. **Run on Android Emulator** or device through Android Studio

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx cap sync` - Sync web assets with native projects
- `npx cap run ios` - Run on iOS device/simulator
- `npx cap run android` - Run on Android device/emulator

## 📱 Mobile Features & Capacitor Plugins

This project includes essential Capacitor plugins for mobile functionality:

### Installed Plugins:
- **@capacitor/app** - App lifecycle events and state management
- **@capacitor/haptics** - Haptic feedback for touch interactions
- **@capacitor/keyboard** - Keyboard management and events
- **@capacitor/status-bar** - Status bar styling and control
- **@capacitor/splash-screen** - Custom splash screen management

### Using Capacitor Plugins:

```typescript
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';

// App lifecycle
App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

// Haptic feedback
const triggerHaptic = async () => {
  await Haptics.impact({ style: ImpactStyle.Medium });
};

// Keyboard events
Keyboard.addListener('keyboardWillShow', info => {
  console.log('Keyboard will show with height:', info.keyboardHeight);
});
```

### Mobile-Specific Styling:

The app includes mobile-optimized CSS with:
- Safe area insets for notched devices
- Touch-friendly interactions
- Responsive breakpoints
- Mobile-first design approach

## 🎨 Development

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
└── lib/                 # Utility functions and configurations

android/                 # Android native project
ios/                     # iOS native project
out/                     # Static export for mobile
public/                  # Static assets
```

### Key Files

- `capacitor.config.ts` - Capacitor configuration
- `next.config.ts` - Next.js config with static export for mobile
- `tailwind.config.ts` - Tailwind CSS configuration
- `src/app/globals.css` - Global styles with mobile optimizations

## 🚀 Deployment

### Web Deployment
The app can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

### Mobile App Store Deployment
1. Build the web assets: `npm run build`
2. Sync with native projects: `npx cap sync`
3. Open in Xcode/Android Studio: `npx cap open ios/android`
4. Build and submit through the respective app stores

## 📝 Notes

- The project uses static export for mobile compatibility
- Capacitor requires the web assets to be in the `out` directory
- iOS and Android projects are automatically generated and can be customized
- All mobile-specific features are handled through Capacitor plugins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## 📄 License
This project is licensed under the MIT License.

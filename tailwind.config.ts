import type { Config } from "tailwindcss";

// Tailwind v4 primarily uses the new CSS-in-JS-less setup with @import "tailwindcss" in CSS.
// This config is kept minimal and extends the theme with our brand color.
const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: "#FF6600",
      },
    },
  },
};

export default config;



import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f1115",
          soft: "#171a21",
          line: "#232833",
        },
        brand: {
          DEFAULT: "#c8102e", // KellRoss red
          dark: "#9b0c23",
          light: "#ff2e4d",
        },
        steel: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d6dae2",
          300: "#b3bac7",
          400: "#8a93a6",
          500: "#687186",
          600: "#515a6e",
          700: "#424959",
          800: "#2b303b",
          900: "#1b1f27",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,18,23,0.06), 0 8px 24px -12px rgba(16,18,23,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;

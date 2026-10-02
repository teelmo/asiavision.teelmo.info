import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asia: {
          bg: "#0b0f1e",
          panel: "#121831",
          accent: "#ff3366",
          accent2: "#3dd6c5",
          gold: "#f4c542",
        },
      },
    },
  },
  plugins: [],
};

export default config;

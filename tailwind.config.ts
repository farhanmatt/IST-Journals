import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        slate: {
          850: "#152033",
          950: "#090d16",
        },
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        "card-hover": "0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
        "glow": "0 0 25px -5px rgba(37, 99, 235, 0.25)",
        "glow-sm": "0 0 15px -3px rgba(37, 99, 235, 0.2)",
        "dropdown": "0 10px 38px -10px rgba(15, 23, 42, 0.15), 0 6px 16px -6px rgba(15, 23, 42, 0.08)",
        "inner-soft": "inset 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-hero": "radial-gradient(at 10% 20%, rgba(37, 99, 235, 0.08) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(14, 165, 233, 0.06) 0px, transparent 50%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};
export default config;

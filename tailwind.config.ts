import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        glass: {
          DEFAULT: "var(--glass-bg)",
          strong: "var(--glass-bg-strong)",
          border: "var(--glass-border)",
        },
        accent: {
          violet: "var(--accent-violet)",
          cyan: "var(--accent-cyan)",
        },
        status: {
          good: "var(--status-good)",
          "good-bg": "var(--status-good-bg)",
          warning: "var(--status-warning)",
          "warning-bg": "var(--status-warning-bg)",
          critical: "var(--status-critical)",
          "critical-bg": "var(--status-critical-bg)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-geist-sans)", "sans-serif"],
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
        "radial-glow":
          "radial-gradient(circle at center, var(--glow-violet), transparent 70%)",
        "radial-glow-cyan":
          "radial-gradient(circle at center, var(--glow-cyan), transparent 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px var(--shadow-ambient)",
        "glow-violet": "0 0 32px var(--glow-violet)",
        "glow-cyan": "0 0 32px var(--glow-cyan)",
        "card-hover":
          "0 12px 40px var(--shadow-ambient), 0 0 24px var(--glow-violet)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        f1: {
          bg: "#0a0a0f",
          card: "#14141f",
          border: "#2a2a3a",
          red: "#e10600",
          muted: "#8888a0",
        },
      },
    },
  },
  plugins: [],
};

export default config;

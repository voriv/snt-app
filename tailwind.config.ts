import type { Config } from "tailwindcss";

export default {
  // Тема управляется через data-theme атрибут в globals.css
  // darkMode не используется, так как мы применяем CSS переменные для всех тем
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

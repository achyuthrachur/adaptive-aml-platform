import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Arial", "sans-serif"],
      },
      colors: {
        crowe: {
          indigo: "#011E41",
          "indigo-mid": "#002E62",
          blue: "#0075C9",
          teal: "#05AB8C",
          amber: "#F5A800",
          coral: "#E5376B",
          purple: "#B14FC5",
        },
      },
    },
  },
  plugins: [],
};

export default config;

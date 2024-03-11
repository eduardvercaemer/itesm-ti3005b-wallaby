/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
    colors: {
      "wallaby-1": "#74a3ff",
      "wallaby-2": "#bcf3ff",
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        wallaby: {
          primary: "#0a2753",
          secondary: "#345dff",
          accent: "#74a3ff",
          neutral: "#bcf3ff",
          "base-100": "#ffffff",
        },
      },
    ],
  },
};

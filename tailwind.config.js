/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'background-move': {
          '0%, 100%': { backgroundPosition: '0 0' },
          '50%': { backgroundPosition: '0px 30px' },
        }
      },
      animation: {
        'background-move': 'background-move 8s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};

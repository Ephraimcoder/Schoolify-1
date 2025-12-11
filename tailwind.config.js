/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        quicksand:["QuicksandRegular", "sans-serif"],
        quicksandBold:["QuicksandBold", "sans-serif"],
        quicksandSemiBold:["QuicksandSemiBold", "sans-serif"],
        quicksandMedium:["QuicksandMedium", "sans-serif"],
        quicksandLight:["QuicksandLight", "sans-serif"],
      }
    },
  },
  plugins: [],
}
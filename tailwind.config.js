/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:    "#C0392B",
        "primary-dark":  "#922B21",
        "primary-light": "#FDEDEC",
        gold:       "#F39C12",
        "gold-light":    "#FEF9E7",
        success:    "#27AE60",
        "success-light": "#EAFAF1",
        warning:    "#E67E22",
        "warning-light": "#FDEBD0",
        danger:     "#E74C3C",
        "danger-light":  "#FDEDEC",
        bgwarm:     "#F8F6F3",
        "text-primary":   "#2C3E50",
        "text-secondary": "#5D6D7E",
        "text-muted":     "#AEB6BF",
        border:     "#E8E8E8",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter:   ["Inter", "sans-serif"],
        mono:    ["'Space Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 1.5s infinite linear",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in":  "fadeIn 0.2s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)",    opacity: 1 },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ['class', "class"],
  theme: {
  	extend: {
  		colors: {
			primary: {
				50: '#E6F2F2',
				100: '#CCE5E5',
				200: '#99CBCB',
				300: '#66B2B2',
				400: '#339898',
				500: '#0D6E6E', // Main primary color
				600: '#0B5858',
				700: '#084242',
				800: '#052C2C',
				900: '#031616',
			  },
			  accent: {
				50: '#FEF9E7',
				100: '#FEF3CF',
				200: '#FCE79F',
				300: '#FBDB6F',
				400: '#F9CF3F',
				500: '#F9C846', // Main accent color
				600: '#C7A038',
				700: '#95782A',
				800: '#63501C',
				900: '#31280E',
			  },
			  slate: {
				50: '#F8FAFC',
				100: '#F0F4F8',
				200: '#E9EFF6',
				300: '#CBD5E0',
				400: '#94A3B8',
				500: '#64748B',
				600: '#475569',
				700: '#3E4C59', // Main text color
				800: '#27272A',
				900: '#0F172A',
			  },
			  success: '#10B981',
			  warning: '#F59E0B',
			  error: '#EF4444',
			  currency: {
				usd: '#D1FAE5',
				gbp: '#DBEAFE',
				ngn: '#DCFCE7',
			  }
			},
		  },
		},
  plugins: [require("tailwindcss-animate")],
}

export default config;

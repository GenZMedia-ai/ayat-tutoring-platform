
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Sales Dashboard Colors
				sales: {
					primary: {
						DEFAULT: 'hsl(var(--sales-primary))',
						light: 'hsl(var(--sales-primary-light))',
						dark: 'hsl(var(--sales-primary-dark))',
					},
					secondary: 'hsl(var(--sales-secondary))',
					tertiary: 'hsl(var(--sales-tertiary))',
					bg: {
						primary: 'hsl(var(--sales-bg-primary))',
						secondary: 'hsl(var(--sales-bg-secondary))',
						tertiary: 'hsl(var(--sales-bg-tertiary))',
					},
					text: {
						primary: 'hsl(var(--sales-text-primary))',
						secondary: 'hsl(var(--sales-text-secondary))',
						tertiary: 'hsl(var(--sales-text-tertiary))',
						muted: 'hsl(var(--sales-text-muted))',
					},
					border: {
						DEFAULT: 'hsl(var(--sales-border))',
						light: 'hsl(var(--sales-border-light))',
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			boxShadow: {
				'sales-xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
				'sales-sm': '0 2px 4px rgba(0, 0, 0, 0.04)',
				'sales-md': '0 4px 8px rgba(0, 0, 0, 0.08)',
				'sales-lg': '0 8px 16px rgba(0, 0, 0, 0.12)',
				'sales-xl': '0 12px 24px rgba(0, 0, 0, 0.16)',
				'sales-focus': '0 0 0 3px rgba(160, 130, 109, 0.1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

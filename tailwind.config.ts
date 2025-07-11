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
				// Design System Colors
				'primary-main': 'hsl(var(--primary-main))',
				'primary-light': 'hsl(var(--primary-light))',
				'primary-dark': 'hsl(var(--primary-dark))',
				'secondary-main': 'hsl(var(--secondary-main))',
				'secondary-light': 'hsl(var(--secondary-light))',
				'secondary-dark': 'hsl(var(--secondary-dark))',
				backgrounds: {
					primary: 'hsl(var(--backgrounds-primary))',
					secondary: 'hsl(var(--backgrounds-secondary))',
					tertiary: 'hsl(var(--backgrounds-tertiary))',
					sidebar: 'hsl(var(--backgrounds-sidebar))'
				},
				neutral: {
					white: 'hsl(var(--neutral-white))',
					gray50: 'hsl(var(--neutral-gray50))',
					gray100: 'hsl(var(--neutral-gray100))',
					gray200: 'hsl(var(--neutral-gray200))',
					gray300: 'hsl(var(--neutral-gray300))',
					gray400: 'hsl(var(--neutral-gray400))',
					gray500: 'hsl(var(--neutral-gray500))',
					gray600: 'hsl(var(--neutral-gray600))',
					gray700: 'hsl(var(--neutral-gray700))',
					gray800: 'hsl(var(--neutral-gray800))',
					gray900: 'hsl(var(--neutral-gray900))',
					black: 'hsl(var(--neutral-black))'
				},
				status: {
					success: {
						background: 'hsl(var(--status-success-background))',
						text: 'hsl(var(--status-success-text))',
						border: 'hsl(var(--status-success-border))'
					},
					warning: {
						background: 'hsl(var(--status-warning-background))',
						text: 'hsl(var(--status-warning-text))',
						border: 'hsl(var(--status-warning-border))'
					},
					danger: {
						background: 'hsl(var(--status-danger-background))',
						text: 'hsl(var(--status-danger-text))',
						border: 'hsl(var(--status-danger-border))'
					},
					info: {
						background: 'hsl(var(--status-info-background))',
						text: 'hsl(var(--status-info-text))',
						border: 'hsl(var(--status-info-border))'
					},
					pending: {
						background: 'hsl(var(--status-pending-background))',
						text: 'hsl(var(--status-pending-text))'
					}
				},
				text: {
					primary: 'hsl(var(--text-primary))',
					secondary: 'hsl(var(--text-secondary))',
					tertiary: 'hsl(var(--text-tertiary))',
					muted: 'hsl(var(--text-muted))',
					inverse: 'hsl(var(--text-inverse))',
					link: 'hsl(var(--text-link))'
				}
			},
			spacing: {
				'280': '280px'
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
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

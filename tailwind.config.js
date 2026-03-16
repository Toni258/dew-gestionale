/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

    // NECESSARIO PER BOTTONI DINAMICI
    safelist: [
        // Button variants
        'btn-primary',
        'btn-secondary',
        'btn-tertiary',
        'btn-ghost',
        'btn-danger',
        'btn-warning',
        'btn-underline',

        // Button sizes
        'btn-sm',
        'btn-md',
        'btn-lg',

        // Custom utilities that Tailwind might purge
        'shadow-ios',
        'shadow-ios-strong',
    ],

    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#398E3B',
                    primaryHover: '#4BA44D',
                    sidebar: '#E0E0E0',
                    background: '#F5F5F5',
                    card: '#FBFBFB',
                    text: '#1F1F1F',
                    textSecondary: '#4F4F4F',
                    divider: '#C6C6C6',
                    error: '#E04848',
                    warning: '#F5C542',
                    secondary: '#4A90E2',
                },
            },

            borderRadius: {
                textField: '6px',
                20: '20px',
            },

            boxShadow: {
                sidebar: '4px 0px 20px rgba(0, 0, 0, 0.15)',
                textField: '0 4px 12px rgba(15, 23, 42, 0.05)',
                textFieldHover: '0 6px 16px rgba(15, 23, 42, 0.08)',
                card: '0 8px 24px rgba(15, 23, 42, 0.06)',
                cardHover: '0 12px 30px rgba(15, 23, 42, 0.09)',
            },
        },
    },

    plugins: [],
};

export const STATIC_PROJECT = (html: string) => ({
    "index.html": html,
});

export const REACT_PROJECT = (code: string) => ({
    "package.json": JSON.stringify({
        "name": "napkin-generated-react",
        "version": "1.0.0",
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "lucide-react": "^0.263.1",
            "tailwindcss": "^3.3.3"
        }
    }, null, 2),
    "src/App.tsx": code,
    "src/main.tsx": `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
  `,
    "src/index.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;
  `,
    "tailwind.config.js": `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
  `,
    "index.html": `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
  `
});

export const NEXTJS_PROJECT = (code: string) => ({
    "package.json": JSON.stringify({
        "name": "napkin-generated-nextjs",
        "version": "1.0.0",
        "dependencies": {
            "next": "14.0.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "lucide-react": "^0.263.1",
            "tailwindcss": "^3.3.3"
        }
    }, null, 2),
    "src/app/page.tsx": code,
    "src/app/layout.tsx": `
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Generated Next.js App',
  description: 'Created with Napkin2Web',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
  `,
    "src/app/globals.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;
  `,
    "tailwind.config.ts": `
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
  `,
    "next.config.js": `
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export'
}
module.exports = nextConfig
  `
});

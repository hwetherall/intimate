# IntiMate - Relationship Intimacy App

IntiMate is a modern web application designed to help couples improve their relationship intimacy through personalized recommendations, activities, and communication tools.

## Features

- **User Authentication**: Secure login and registration using Supabase Auth
- **Intimacy Passport**: Personalized questionnaire to understand preferences and boundaries
- **Sessions**: Guided intimacy sessions for couples
- **Partner Connection**: Connect with your partner to share preferences and activities

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Authentication & Database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Setup

### Setting up the Passport Feature

The Passport feature requires specific database tables and configurations. You can set these up by running the SQL statements in the `lib/databaseSetup.ts` file.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL statements from `lib/databaseSetup.ts`
5. Run the query to create:
   - `passport_answers` table for storing user responses
   - `passport_questions` table for storing questions (optional)
   - Add the `passport_completion` field to the `profiles` table

## Development

### Project Structure

- `/components`: Reusable UI components
- `/contexts`: React context providers (Auth, etc.)
- `/lib`: Utility functions and API helpers
- `/pages`: Main application pages
- `/src`: Core application files

### Passport Feature

The Passport feature consists of:

1. A questionnaire interface (`/pages/Questions.tsx`)
2. A dashboard to view completion status (`/pages/Passport.tsx`)
3. Helper functions for data management (`/lib/passportHelpers.ts`)

## Original Vite Template Information

This project was bootstrapped with Vite. Below is the original template information:

### React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

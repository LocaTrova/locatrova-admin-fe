 # Vite Frontend Project

This project is a frontend application built using **Vite** and **TypeScript**. It follows a modular structure to ensure scalability and maintainability.

## Project Structure

```
vite-frontend/
├── node_modules/          # Project dependencies
├── public/                # Static assets (images, fonts, etc.)
├── src/                   # Application source code
│   ├── api/               # Functions with api calls to the backend
│   ├── pages/             # Page components
│   ├── routes/            # Routing configuration
│   ├── App.css            # Main application styles
│   ├── App.tsx            # Main application component
│   ├── index.css          # Global styles
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # TypeScript definitions for Vite
├── bun.lock               # Bun lock file
├── eslint.config.js       # ESLint configuration
├── index.html             # Main HTML file
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation (this file)
├── TEMPLATE_README.md     # Template for README files
├── tsconfig.app.json      # TypeScript configuration for the app
├── tsconfig.json          # Base TypeScript configuration
├── tsconfig.node.json     # TypeScript configuration for Node
└── vite.config.ts         # Vite configuration
```

### Environment Variables

Create the following environment files:

- `.env` - Development environment (already created)
- `.env.production` - Production environment (already created)
- `.env.local` - Local overrides (optional)

Required environment variables:
- `VITE_API_URL` - The API base URL (e.g., `https://api.locatrova.it`)

### Installation  

```bash  
bun install
```

### Running the Project
- Start the development server:
```bash
bun run dev
```
- Open your browser and navigate to `http://localhost:5173`.


## Key Directories
- **`src/api/`**: Contains custom functions that makes the api calls to the backend. Pay extreme attention to the return type
- **`src/pages/`**: Page components for different routes.

## Scripts
- `dev`: Starts the development server.

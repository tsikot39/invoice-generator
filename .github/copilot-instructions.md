# Copilot Instructions for Invoice Generator SaaS

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a Next.js SaaS application for generating and managing billing invoices. The application follows modern web development best practices.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB with Mongoose
- **Validation**: Zod schemas
- **Icons**: Lucide React
- **PDF Generation**: React-PDF or jsPDF

## Architecture Guidelines

- Use App Router structure with server and client components appropriately
- Implement TypeScript strictly throughout the application
- Follow component-based architecture with reusable components
- Use Zod for all form validation and API input validation
- Implement proper error handling and loading states
- Follow security best practices for authentication and data protection

## Folder Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions, database connections, schemas
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks
- `/src/schemas` - Zod validation schemas

## Key Features to Implement

1. User authentication with Google OAuth
2. Client management (CRUD operations)
3. Product/Service management
4. Invoice generation and management
5. Dashboard with analytics
6. PDF export functionality
7. Role-based access control

## Code Style

- Use TypeScript interfaces and types consistently
- Implement proper error boundaries
- Use server actions for form submissions
- Implement proper loading states and error handling
- Follow accessibility best practices
- Use semantic HTML and proper ARIA attributes

# Super T - Supermarket Management System

A comprehensive web-based management system for supermarkets, featuring Point of Sale (POS), Inventory Management, and detailed Reporting.

## Project Purpose
The purpose of this project is to provide supermarket owners and managers with a robust, all-in-one platform to manage their daily operations. This includes tracking stock levels, processing sales, managing suppliers and customers, and generating financial and inventory reports to make data-driven decisions.

## Technology and Tools Used
- **Frontend**: [Next.js](https://nextjs.org/) (React Framework)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) and [Lucide React](https://lucide.dev/) for icons.
- **Charts**: [Recharts](https://recharts.org/) for data visualization.
- **State Management**: React Context API with a custom Store Provider.
- **Persistence**: Browser `localStorage` with a repository pattern that supports future migrations (e.g., SQLite).
- **Security**: Web Crypto API for secure password hashing.
- **Forms**: React Hook Form with Zod validation.

## Implementation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials
- **Email**: `admin@supert.com`
- **Password**: `admin123`

### Key Features
- **Unified Workflow**: A single, consistent navigation menu across the sidebar and dashboard.
- **Persistence**: Data is automatically saved to your browser's local storage after the first entry.
- **Role-Based Access**: Support for Admin, Manager, and Viewer roles with appropriate permissions.
- **Database Management**: Export and import full database backups in SQL format or individual tables in CSV.

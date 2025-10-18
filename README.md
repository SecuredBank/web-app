# SecuredBank - Cybersecurity Web Application

A modern, responsive web application for bank cybersecurity monitoring and management built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Security Dashboard**: Real-time monitoring of security metrics and alerts
- **User Management**: Role-based access control with user administration
- **Security Monitoring**: Advanced alert filtering and management system
- **Reports**: Comprehensive reporting with multiple formats (PDF, CSV, JSON)
- **Settings**: Configurable application settings and preferences
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark/Light Theme**: System preference detection with manual override
- **Real-time Updates**: Live data updates and notifications

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Testing**: Vitest, Testing Library
- **Code Quality**: ESLint, Prettier

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/SecuredBank/web-app.git
cd web-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Card, Input)
│   ├── layout/         # Layout components (Header, Sidebar, Layout)
│   └── forms/          # Form components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── contexts/           # React Context providers
├── constants/          # Application constants
├── assets/             # Static assets
└── test/               # Test setup and utilities
```

## 🎨 Design System

The application uses a comprehensive design system with:

- **Colors**: Primary, secondary, success, warning, and danger color palettes
- **Typography**: Inter font family with consistent sizing
- **Spacing**: Consistent spacing scale using Tailwind CSS
- **Components**: Reusable components with consistent styling
- **Animations**: Smooth transitions and micro-interactions

## 🔐 Authentication

The application includes a mock authentication system for development:

- **Demo Credentials**:
  - Email: `admin@securedbank.com`
  - Password: `admin123`

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🧪 Testing

Run tests with:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚀 Deployment

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@securedbank.com or create an issue in the repository.

---

Built with ❤️ by the SecuredBank Team
# Next.js 14 + thirdweb + Serwist PWA

A modern, full-stack Progressive Web Application built with Next.js 14, featuring Web3 authentication with thirdweb, and offline capabilities powered by Serwist.

## 🚀 Features

- **🔐 Web3 Authentication**: Seamless wallet connection and user authentication using thirdweb
- **📱 Progressive Web App**: Full PWA capabilities with offline support via Serwist
- **🔔 Push Notifications**: Web push notifications for user engagement
- **🌙 Dark/Light Mode**: Responsive design with theme support
- **📱 Mobile-First**: Optimized for mobile devices with install prompts
- **⚡ Modern Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: thirdweb, Wagmi, Viem
- **PWA**: Serwist (Service Worker)
- **State Management**: TanStack Query
- **Notifications**: Web Push API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- A thirdweb account and Client ID from [thirdweb.com](https://thirdweb.com)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd next14-thirdweb-serwist
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Option 1: Copy from example (if .env.example exists)
cp .env.example .env.local

# Option 2: Create manually
touch .env.local
```

Add the following environment variables to your `.env.local` file:

```env
# thirdweb Configuration (Required)
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id_here

# Web Push Configuration (Required for notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
WEB_PUSH_EMAIL=mailto:your-email@example.com
```

> **Important**: Replace all placeholder values with your actual credentials. See the steps below for obtaining these values.

### 4. Generate VAPID Keys

Generate VAPID keys for web push notifications:

```bash
npx web-push generate-vapid-keys --json
```

Copy the generated keys to your `.env.local` file.

### 5. Get thirdweb Client ID

1. Visit [thirdweb.com](https://thirdweb.com) and create an account
2. Create a new project and copy your Client ID
3. Add the Client ID to your `.env.local` file

To learn how to create a client ID, refer to the [client documentation](https://portal.thirdweb.com/typescript/v5/client).

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Mode

For full PWA functionality (including install prompts):

```bash
npm run build && npm run start
```

> **Note**: The install app button only works in production mode (`npm run build && npm run start`)

## 📱 PWA Features

### Installation

- **Desktop**: Install button appears in supported browsers
- **Mobile**: Add to Home Screen prompts on iOS/Android
- **Offline**: Service worker enables offline functionality

### Push Notifications

The app includes web push notification capabilities for user engagement and updates.

## 🔧 Project Structure

```
next14-thirdweb-serwist/
├── app/
│   ├── components/          # React components
│   │   ├── InstallPWA.tsx  # PWA install prompt
│   │   └── ...
│   ├── ~offline/           # Offline page
│   └── ...
├── public/                 # Static assets
└── ...
```

## 🔗 Key Components

- **thirdweb Client**: thirdweb authentication integration
- **InstallPWA**: PWA installation prompts

## 🌐 API Integration

The app integrates with:

- **thirdweb**: For Web3 authentication and blockchain interactions
- **Web Push API**: For notifications

## 📚 Resources

- [thirdweb Documentation](https://portal.thirdweb.com/typescript/v5)
- [thirdweb Templates](https://thirdweb.com/templates)
- [Next.js 14 Documentation](https://nextjs.org/)
- [Serwist Documentation](https://serwist.pages.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Join [Monad Dev Discord](https://discord.gg/monaddev)
2. Review the [thirdweb](https://portal.thirdweb.com/) documentation
3. Check the [Next.js 14](https://nextjs.org/) documentation
4. Check the [Serwist](https://serwist.pages.dev/) documentation
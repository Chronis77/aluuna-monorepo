# Aluuna - Therapeutic AI Companion

A React Native app built with Expo that provides a therapeutic AI companion for emotional support and personal growth.

## Features

### 🧠 Session Management
- **Interactive Chat Interface**: Real-time conversation with AI therapeutic companion
- **Session History**: Access and manage multiple therapy sessions
- **Voice Input**: Speech-to-text functionality for hands-free communication
- **Responsive Design**: Optimized for mobile with smooth animations

### 🎯 User Experience
- **Intuitive Navigation**: Sidebar menu for session management
- **Profile Menu**: Access to emotion trends, insights, mantras, and settings
- **Real-time Feedback**: Toast notifications for user actions
- **Smooth Animations**: Spring-based sidebar transitions and recording animations

### 🔐 Authentication
- **Secure Login/Register**: Supabase-powered authentication
- **Session Persistence**: Automatic login state management
- **Profile Management**: User settings and preferences

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the development server
   ```bash
   npx expo start
   ```

3. Run on your preferred platform
   - iOS: Press `i` in the terminal or scan QR code with Expo Go
   - Android: Press `a` in the terminal or scan QR code with Expo Go
   - Web: Press `w` in the terminal

## Project Structure

```
aluuna/
├── app/                    # Expo Router pages
│   ├── session.tsx        # Main session page
│   ├── login.tsx          # Authentication
│   ├── register.tsx       # User registration
│   └── loading.tsx        # Loading screen
├── components/            # Reusable components
│   ├── MessageBubble.tsx  # Chat message component
│   ├── VoiceInput.tsx     # Voice recording component
│   ├── Sidebar.tsx        # Session navigation
│   ├── ProfileMenu.tsx    # User profile menu
│   └── ui/               # UI components
├── lib/                  # External services
│   └── supabase.ts       # Supabase client
└── assets/              # Images and fonts
```

## Key Components

### Session Screen (`app/session.tsx`)
The main interface where users interact with the AI companion:

- **Header**: Navigation with burger menu, logo, and profile icon
- **Chat Area**: Message bubbles with timestamps
- **Input Area**: Text input with voice recording capability
- **Sidebar**: Session management and navigation
- **Profile Menu**: User settings and features

### Voice Input (`components/VoiceInput.tsx`)
Handles voice recording with:
- Permission management
- Recording animations
- Error handling
- Transcription simulation

### Message Bubble (`components/MessageBubble.tsx`)
Displays chat messages with:
- User/AI message distinction
- Timestamp display
- Responsive styling

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **NativeWind**: Tailwind CSS for React Native
- **Supabase**: Backend and authentication
- **Expo AV**: Audio recording capabilities
- **React Native Gesture Handler**: Touch interactions

## Development

### Adding New Features
1. Create components in the `components/` directory
2. Add pages to the `app/` directory for routing
3. Update the database schema in Supabase
4. Test on both iOS and Android

### Styling
The app uses NativeWind (Tailwind CSS) for styling. All components use className props for consistent styling.

### State Management
Local state is managed with React hooks. For global state, consider adding a state management library like Zustand or Redux.

## Future Enhancements

- [ ] Real AI integration with OpenAI GPT
- [ ] Emotion tracking and analytics
- [ ] Memory profile management
- [ ] Relationship tracking
- [ ] Mantra and meditation features
- [ ] Push notifications
- [ ] Offline support
- [ ] Data export functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

# Google OAuth Integration Guide - Kama Mobile

## Overview

Google OAuth has been successfully integrated into the Kama Mobile application using `expo-auth-session`. Users can now sign in and register using their Google accounts across iOS, Android, and Web platforms.

## Client IDs Configuration

The following Google OAuth Client IDs have been configured for different platforms:

- **iOS**: `558389557921-q5ncmqk6v8tdlub0627pkp1bi0she93n.apps.googleusercontent.com`
- **Android**: `558389557921-4m38u0474fi4naqql3sakmh2iri28h9m.apps.googleusercontent.com`
- **Web**: `558389557921-ss8viikrjsfabtoct3cle0thi0iokst2.apps.googleusercontent.com`

## Files Modified

### 1. **lib/auth/auth-context.tsx**

- Added Google OAuth configuration with platform-specific client IDs
- Imported `expo-web-browser` and `expo-auth-session`
- Added `signInWithGoogle()` method to AuthContextValue type
- Implemented Google authentication logic:
  - Uses `Google.useAuthRequest()` hook
  - Handles authentication response
  - Calls backend `/auth/google` endpoint
  - Saves token and user data on success
  - Navigates to home screen on successful login
- Warm up browser on component mount for faster OAuth flow

### 2. **lib/api/auth.ts**

- Added `loginWithGoogle()` function
- Sends `idToken` and `accessToken` to `/auth/google` backend endpoint
- Supports optional language parameter

### 3. **app/(auth)/login.tsx**

- Added Google Sign-In button below the email/password login
- Implemented `handleGoogleLogin()` function
- Visual separator line (OR) between email and Google login options
- White Google button with consistent styling
- Error handling for Google authentication failures

### 4. **app/(auth)/register.tsx**

- Added Google Sign-Up button below the email/password registration
- Implemented `handleGoogleSignUp()` function
- Visual separator line (OR) between email and Google signup options
- White Google button with consistent styling
- Error handling for Google authentication failures

### 5. **app.json**

- Added `expo-auth-session` plugin configuration
- Set Google Client ID for web platform
- Maintains existing Expo Router and Splash Screen configurations

## Backend Integration Required

To complete the Google OAuth flow, your backend must implement:

### POST `/auth/google`

**Request Body:**

```typescript
{
  idToken: string;        // Google ID Token
  accessToken: string;    // Google Access Token
  language?: string;      // Optional language preference
}
```

**Response:**

```typescript
{
  token: string;          // Your app's auth token
  expiresAt: string;      // Token expiration timestamp
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    role?: string;
    language?: string;
    xp?: number;
    streak?: number;
    offlineEnabled?: boolean;
    createdAt?: string;
  }
}
```

**Implementation Steps:**

1. Verify the Google `idToken` using Google's tokeninfo endpoint
2. Extract user information from the token (email, name, picture)
3. Check if user exists in database
4. If new user:
   - Create new user account with Google-provided info
   - Auto-generate username from email if needed
5. If existing user:
   - Update profile picture if from Google
   - Link Google account if not already linked
6. Generate and return your app's authentication token

## Setup Instructions

### 1. Install Dependencies

All required dependencies are already in `package.json`:

- `expo-auth-session` - OAuth provider
- `expo-crypto` - Encryption support
- `expo-web-browser` - Web browser integration
- `expo-secure-store` - Token storage (native)
- `@react-native-async-storage/async-storage` - Token storage (web)

No additional npm install needed.

### 2. Environment Setup (if needed)

The Google Client IDs are hardcoded in the auth context. For production, consider moving them to environment variables:

```typescript
// Example: .env.local
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=558389557921-q5ncmqk6v8tdlub0627pkp1bi0she93n.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=558389557921-4m38u0474fi4naqql3sakmh2iri28h9m.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=558389557921-ss8viikrjsfabtoct3cle0thi0iokst2.apps.googleusercontent.com
```

Then update `auth-context.tsx`:

```typescript
const GOOGLE_CLIENT_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
};
```

### 3. Test OAuth Flow

#### On iOS:

```bash
npm run ios
# Click "Continue with Google" button
# Complete Google authentication flow
# Token should be saved and user redirected to home screen
```

#### On Android:

```bash
npm run android
# Click "Continue with Google" button
# Complete Google authentication flow
# Token should be saved and user redirected to home screen
```

#### On Web:

```bash
npm run web
# Click "Continue with Google" button
# Browser popup opens for OAuth flow
# Token stored in localStorage
# User redirected to home screen
```

## Error Handling

The implementation includes error handling for:

- Missing authentication tokens
- Google authentication cancellation
- Network failures
- Backend API errors
- Invalid token responses

Errors are displayed to the user in the error message area of the login/register screens.

## Security Considerations

1. **Token Storage**:
   - iOS/Android: Uses `expo-secure-store` (encrypted)
   - Web: Uses `localStorage` (consider upgrading to encrypted storage)

2. **HTTPS Only**:
   - Ensure your backend API is HTTPS
   - Google OAuth requires HTTPS in production

3. **Token Expiration**:
   - Handle token refresh in backend
   - Implement token expiration checks

4. **CORS**:
   - Ensure backend allows requests from your app's origin
   - Configure proper CORS headers for web platform

## Browser Warm-up

The implementation includes browser warm-up to improve OAuth flow performance:

```typescript
useEffect(() => {
  WebBrowser.warmUpAsync();
}, []);
```

This pre-initializes the browser when the app starts, making the OAuth flow smoother.

## Platform-Specific Notes

### iOS

- Uses custom URL scheme: `kamamobile://`
- Bundle ID: `com.ngothtsika.kamamobile`
- OAuth flow uses native Safari browser

### Android

- Uses custom URL scheme: `kamamobile://`
- Package name: `com.ngothtsika.kamamobile`
- OAuth flow uses Chrome browser

### Web

- Uses default web flow
- Tokens stored in localStorage
- Consider implementing secure cookie storage for production

## Next Steps

1. **Implement Backend Endpoint**: Create `/auth/google` endpoint in your backend
2. **Test All Platforms**: Test iOS, Android, and web thoroughly
3. **Add Social Sign-Up**: Consider adding profile completion after Google signup
4. **Implement Token Refresh**: Add token refresh logic for expired tokens
5. **Add Sign-Out**: Ensure proper cleanup when signing out
6. **Analytics**: Track Google OAuth sign-ups vs email sign-ups

## Troubleshooting

### "Google authentication failed"

- Verify Client IDs are correct
- Check internet connection
- Ensure backend `/auth/google` endpoint exists
- Check backend error logs

### OAuth popup doesn't appear

- On iOS/Android: Check URL scheme configuration
- On web: Check browser popup blocker settings
- Verify `expo-auth-session` is properly installed

### Token not being saved

- Check token storage permissions
- On iOS/Android: Verify Keychain/Secure Store configuration
- On web: Check localStorage is available

### User not redirected after login

- Verify backend returns proper response format
- Check router path `/(tabs)/home` exists
- Verify navigation context is properly set up

## Support

For more information about `expo-auth-session`:

- [Expo Auth Session Documentation](https://docs.expo.dev/guides/authentication/)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)

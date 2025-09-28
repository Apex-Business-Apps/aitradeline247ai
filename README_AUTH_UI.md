# Auth UI Implementation

## Overview
Frontend authentication using Supabase Auth with magic links. Provides secure login/logout flow and route protection.

## Files Created
- `src/lib/supabaseClient.ts` - Supabase client configuration
- `src/context/AuthProvider.tsx` - React context for auth state
- `src/hooks/useAuth.ts` - Hook to access auth context
- `src/routes/login.tsx` - Magic link login page
- `src/routes/logout.tsx` - Logout handler
- `src/lib/protect.tsx` - Route protection component

## Usage

### Protecting Routes
Wrap protected routes with the `<Protected>` component:

```tsx
import { Protected } from '@/lib/protect';

// In your route file
const SettingsPage = () => {
  return (
    <Protected>
      <YourSettingsComponent />
    </Protected>
  );
};

export default SettingsPage;
```

### App Integration
Wrap your app with AuthProvider:

```tsx
import { AuthProvider } from '@/context/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Your routes */}
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Environment Variables
Ensure these are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Flow
1. User enters email on `/login`
2. Magic link sent via Supabase Auth
3. User clicks link, gets redirected with session
4. Protected routes now accessible
5. Logout via `/logout` clears session
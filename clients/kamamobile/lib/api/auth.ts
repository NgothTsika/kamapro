// All auth functions are now in /lib/kama-api.ts
// This file is kept for backward compatibility
export {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getMe,
  logout,
} from "@/lib/kama-api";

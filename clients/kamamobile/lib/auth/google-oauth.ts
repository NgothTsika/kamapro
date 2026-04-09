import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";
import React from "react";

// Google OAuth Client IDs
const GOOGLE_CLIENT_IDS = {
  ios: "558389557921-q5ncmqk6v8tdlub0627pkp1bi0she93n.apps.googleusercontent.com",
  android:
    "558389557921-4m38u0474fi4naqql3sakmh2iri28h9m.apps.googleusercontent.com",
  web: "558389557921-ss8viikrjsfabtoct3cle0thi0iokst2.apps.googleusercontent.com",
};

export const getGoogleClientId = () => {
  if (Platform.OS === "ios") {
    return GOOGLE_CLIENT_IDS.ios;
  } else if (Platform.OS === "android") {
    return GOOGLE_CLIENT_IDS.android;
  } else {
    return GOOGLE_CLIENT_IDS.web;
  }
};

export const useGoogleAuth = () => {
  const clientId = getGoogleClientId();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  // Handle response
  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // Token is available in the response
        console.log("Google authentication successful");
      }
    }
  }, [response]);

  return { request, response, promptAsync };
};

// Warm up the browser when the component mounts
WebBrowser.warmUpAsync();

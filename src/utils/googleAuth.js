/**
 * Utility functions for Google authentication
 */

// Google client ID from your Google Cloud Console
export const GOOGLE_CLIENT_ID = '340874428494-ot9uprkvvq4ha529arl97e9mehfojm5b.apps.googleusercontent.com';

/**
 * Loads the Google API script and initializes the Sign-In client
 * @param {Function} callback - Function to call after successful initialization
 */
export const initializeGoogleAuth = (callback) => {
  // Check if script already exists
  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existingScript) {
    if (window.google && window.google.accounts) {
      if (callback) callback();
    }
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    // Initialize Google Sign-In
    if (window.google && window.google.accounts) {
      if (callback) callback();
    }
  };
  document.body.appendChild(script);
};

/**
 * Configures Google Sign-In with the provided callback
 * @param {Function} responseCallback - Function to handle the sign-in response
 */
export const configureGoogleSignIn = (responseCallback) => {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: responseCallback,
      auto_select: false,
    });
    return true;
  }
  return false;
};

/**
 * Prompts the user to sign in with Google
 * @returns {Boolean} Whether the prompt was successfully shown
 */
export const promptGoogleSignIn = () => {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.prompt();
    return true;
  }
  return false;
};
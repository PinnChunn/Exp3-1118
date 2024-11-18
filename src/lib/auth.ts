import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { createUserProfile, getUserProfile } from './users';

const AUTHORIZED_DOMAINS = [
  'github-ifz6r7.bolt.new',
  'stackblitz.io',
  'stackblitz.com',
  'bolt.new',
  'exp32024.firebaseapp.com',
  'exp32024.web.app',
  'localhost',
  'localhost:5173',
  'localhost:3000',
  'githubifz6r7-ipmo-kr6v54ci--5173--d3acb9e1.local-credentialless.webcontainer.io',
  'webcontainer.io',
  'local-credentialless.webcontainer.io',
  'exp31118-jb3c--5173--d3acb9e1.local-credentialless.webcontainer.io',
  'github.com',
  'stackblitz.com'
];

const isDomainAuthorized = (domain: string) => {
  console.log('Checking domain:', domain);
  // 更精確的域名檢查
  const isAuthorized = AUTHORIZED_DOMAINS.some(authDomain => {
    const isDirect = domain === authDomain;
    const isSubdomain = domain.endsWith(`.${authDomain}`);
    const isWebContainer = domain.includes('webcontainer.io');
    const isLocalhost = domain.includes('localhost') && authDomain.includes('localhost');
    const isStackblitz = domain.includes('stackblitz.com') || domain.includes('stackblitz.io');
    
    console.log(`Domain check for ${authDomain}:`, {
      isDirect,
      isSubdomain,
      isWebContainer,
      isLocalhost,
      isStackblitz
    });

    return isDirect || isSubdomain || isWebContainer || isLocalhost || isStackblitz;
  });

  console.log('Final authorization result:', isAuthorized);
  return isAuthorized;
};

export const handleAuthError = (error: any) => {
  console.error('Authentication error:', error);
  
  switch (error.code) {
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups or try again.';
    case 'auth/cancelled-popup-request':
      return 'Authentication was cancelled. Please try again.';
    case 'auth/unauthorized-domain':
      return `This domain is not authorized for authentication. Domain: ${window.location.hostname}`;
    case 'auth/popup-closed-by-user':
      return 'Authentication window was closed. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again later.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

export const signInWithGoogle = async () => {
  try {
    const domain = window.location.hostname;
    console.log('Attempting login from domain:', domain);

    if (!isDomainAuthorized(domain)) {
      console.error('Unauthorized domain:', domain);
      throw new Error(`Unauthorized domain: ${domain}`);
    }

    try {
      console.log('Attempting popup sign in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign in successful:', result);

      if (result.user) {
        const { user: userProfile, error: profileError } = await createUserProfile({
          id: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          avatar: result.user.photoURL
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(profileError);
        }

        return { user: userProfile, error: null };
      }
    } catch (popupError: any) {
      console.log('Popup error:', popupError);
      
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/unauthorized-domain' ||
          popupError.code === 'auth/cancelled-popup-request') {
        console.log('Falling back to redirect sign in...');
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: null };
      }
      throw popupError;
    }
    
    return { user: null, error: 'No user data received' };
  } catch (error: any) {
    console.error('Final error catch:', error);
    const errorMessage = handleAuthError(error);
    return { user: null, error: errorMessage };
  }
};

export const handleRedirectResult = async () => {
  try {
    console.log('Checking redirect result...');
    const result = await getRedirectResult(auth);
    console.log('Redirect result:', result);

    if (result?.user) {
      const { user: userProfile, error: profileError } = await createUserProfile({
        id: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        avatar: result.user.photoURL
      });

      if (profileError) {
        throw new Error(profileError);
      }

      return { user: userProfile, error: null };
    }
    return { user: null, error: null };
  } catch (error: any) {
    console.error('Redirect result error:', error);
    const errorMessage = handleAuthError(error);
    return { user: null, error: errorMessage };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error: 'Failed to sign out. Please try again.' };
  }
};

export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        console.log('Current user:', user);
        const { user: userProfile } = await getUserProfile(user.uid);
        resolve(userProfile || {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL
        });
      } else {
        console.log('No current user');
        resolve(null);
      }
    });
  });
};
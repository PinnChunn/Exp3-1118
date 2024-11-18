import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC16ekl_0eR4RarphTPMXt64bHQZrgrWkk",
  authDomain: "exp32024.firebaseapp.com",
  projectId: "exp32024",
  storageBucket: "exp32024.appspot.com",
  messagingSenderId: "581668076921",
  appId: "1:581668076921:web:60b74d89aab332943083a8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
auth.useDeviceLanguage(); // 添加語言支援

export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email'); // 添加電子郵件範圍
googleProvider.addScope('profile'); // 添加個人資料範圍
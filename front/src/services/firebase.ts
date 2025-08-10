// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration from login.html
const firebaseConfig = {
    apiKey: "AIzaSyBs5-OMmuj7ONsUosbyfwowjO-1diBhXoU",
    authDomain: "openrun-ed7a1.firebaseapp.com",
    projectId: "openrun-ed7a1",
    storageBucket: "openrun-ed7a1.appspot.com", // Using .appspot.com as it's more standard
    messagingSenderId: "4793689059",
    appId: "1:4793689059:web:282843d13c85bb7efb76d6",
    measurementId: "G-YVKCQ514WS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance and provider for use in other components
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// You can also export a sign-in function to keep auth logic centralized
export const signInWithGooglePopup = async (): Promise<string | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        return idToken;
    } catch (error) {
        console.error("Authentication failed:", error);
        alert("Error: " + (error as Error).message);
        return null;
    }
};

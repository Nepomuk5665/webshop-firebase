// firebase-init.js - Single source of Firebase initialization
(function() {
    try {
        // Global firebase config object
        window.firebaseConfig = {
            apiKey: "AIzaSyCLzqRoxmg4L51vdOHOdJTaBYenBIJaEcg",
            authDomain: "webshop-5665.firebaseapp.com",
            projectId: "webshop-5665",
            storageBucket: "webshop-5665.appspot.com",
            messagingSenderId: "476272418450",
            appId: "1:476272418450:web:00c517eefe311bb01a904b"
        };

        // Initialize Firebase only once
        if (!window.firebaseInitialized) {
            firebase.initializeApp(window.firebaseConfig);
            window.firebaseInitialized = true;
            console.log("Firebase initialized successfully");
        }

        // Export Firebase services as global variables
        // Check if each service is available before assigning
        if (typeof firebase.firestore === 'function') {
            window.db = firebase.firestore();
            console.log("Firestore initialized");
        } else {
            console.error("Firebase Firestore SDK not loaded");
        }

        if (typeof firebase.auth === 'function') {
            window.auth = firebase.auth();
            console.log("Auth initialized");
        } else {
            console.error("Firebase Auth SDK not loaded");
        }

        if (typeof firebase.storage === 'function') {
            window.storage = firebase.storage();
            console.log("Storage initialized");
        } else {
            console.log("Firebase Storage SDK not loaded - this is OK for pages not using storage");
        }
        
        // Export server timestamp function - with a fallback
        window.createTimestamp = function() {
            if (firebase.firestore && firebase.firestore.FieldValue && 
                typeof firebase.firestore.FieldValue.serverTimestamp === 'function') {
                return firebase.firestore.FieldValue.serverTimestamp();
            } else {
                console.warn("Firebase serverTimestamp not available, using local Date");
                return new Date();
            }
        };

        console.log("Firebase services exported globally");
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
})();
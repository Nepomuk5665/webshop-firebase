// This file is deprecated - using firebase-init.js instead
// Keeping this file to maintain backward compatibility

// Variables should be defined by firebase-init.js
if (typeof db === 'undefined') {
    console.error('Firebase services not initialized properly. Make sure firebase-init.js is loaded first.');
}

// For backward compatibility
const auth = window.auth;
const db = window.db;
const storage = window.storage;
const timestamp = function() {
    return window.createTimestamp();
};
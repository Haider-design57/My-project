// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkRdT1zzdIUqVhdu-9R9ova2PFH0FB8aw",
    authDomain: "virtualclassroomarrangement.firebaseapp.com",
    projectId: "virtualclassroomarrangement",
    storageBucket: "virtualclassroomarrangement.firebasestorage.app",
    messagingSenderId: "409727887762",
    appId: "1:409727887762:web:ec677ee04492bae9f9b94b"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase service instances
const auth = firebase.auth();
const db = firebase.firestore();

// Export Firebase instances for use in other files
window.auth = auth;
window.db = db;

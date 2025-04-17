// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');

// Initialize Bootstrap Modal
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

// Show registration modal
registerBtn.addEventListener('click', () => {
    registerModal.show();
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if user is a teacher in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'teacher') {
            window.location.href = '/dashboard.html';
        } else {
            await auth.signOut();
            alert('Access denied. Only teachers can login.');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Registration handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    // Validate inputs
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        // Check if Firebase is initialized
        if (!firebase.apps.length && !firebase.app()) {
            firebase.initializeApp(firebaseConfig);
        }

        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        try {
            // Update user profile with display name
            await user.updateProfile({
                displayName: name
            });

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'teacher',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Sign out the user after successful registration
            await auth.signOut();

            registerModal.hide();
            registerForm.reset();
            alert('Registration successful! Please login with your new account.');
        } catch (profileError) {
            // If profile update or Firestore creation fails, delete the auth user
            await user.delete();
            throw new Error('Failed to complete registration: ' + profileError.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
});

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // If user is already logged in and on login page, redirect to dashboard
        if (window.location.pathname === '/login.html') {
            window.location.href = '/dashboard.html';
        }
    } else {
        // If user is not logged in and not on login page, redirect to login
        if (window.location.pathname !== '/login.html' && 
            window.location.pathname !== '/' && 
            window.location.pathname !== '/index.html') {
            window.location.href = '/login.html';
        }
    }
});
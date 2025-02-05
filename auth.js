import { auth } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Update UI based on authentication state
const updateUI = (user) => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userProfile.style.display = 'flex';
        userAvatar.src = user.photoURL || 'default-avatar.png';
        userName.textContent = user.displayName || user.email;
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userProfile.style.display = 'none';
        userAvatar.src = '';
        userName.textContent = '';
    }
};

// Login with Google
const login = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('Logged in user:', user);
    } catch (error) {
        console.error('Login error:', error);
    }
};

// Logout
const logout = async () => {
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    updateUI(user);
});

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
});
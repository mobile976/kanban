// plugins/firebase.js
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAddoOyUYIKenKZ1cDbmGWnpQHAI_umJTA",
  authDomain: "kanban-3d053.firebaseapp.com",
  projectId: "kanban-3d053",
  storageBucket: "kanban-3d053.firebasestorage.app",
  messagingSenderId: "638941970632",
  appId: "1:638941970632:web:a4c9739c9d4be1805225fd"
};

// Initialize Firebase app (prevent multiple initializations)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const auth = firebase.auth();
const firestore = firebase.firestore();

export { auth, firestore };



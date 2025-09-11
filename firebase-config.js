const firebaseConfig = {
  apiKey: "AIzaSyAw0POKFHZkLMJdOvTnqlc4B2jMHaUdC44",
  authDomain: "portal-certificados-antiplaga.firebaseapp.com",
  projectId: "portal-certificados-antiplaga",
  storageBucket: "portal-certificados-antiplaga.firebasestorage.app",
  messagingSenderId: "1027821457649",
  appId: "1:1027821457649:web:4a649763d0505db83c9950"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

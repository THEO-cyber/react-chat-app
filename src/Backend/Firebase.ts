// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_API_KEY,
//   authDomain: process.env.REACT_APP_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_APP_ID,
// };
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8LB4g0Bp9oSAXPDtWvb4uuMs7oVHdqV8",
  authDomain: "typescript-react-app.firebaseapp.com",
  projectId: "typescript-react-app",
  storageBucket: "typescript-react-app.appspot.com",
  messagingSenderId: "365118328795",
  appId: "1:365118328795:web:e082e4e1cea2a711e361fe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//working
const db =getFirestore(app);
const auth = getAuth() //working with authentication services

export {db,auth};
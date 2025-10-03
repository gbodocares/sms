// Import Firebase SDK (v9+ modular)
 import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
    import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCzeXvcgkgLgQu1Pj2qce4wANvbe7ChWO4",
  authDomain: "gclc-eabb4.firebaseapp.com",
  databaseURL: "https://gclc-eabb4-default-rtdb.firebaseio.com",
  projectId: "gclc-eabb4",
  storageBucket: "gclc-eabb4.appspot.com",
  messagingSenderId: "588542989378",
  appId: "1:588542989378:web:ee83a42419ccaeac0249db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Retrieve and check access code
async function getCode() {
  try {
    const docRef = doc(db, "codes", "instructor");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const accessCode = docSnap.data().code;
    //   console.log("Retrieved code:", accessCode);

      const userInput = prompt("Enter Instructor Access Code:");

      if (userInput !== accessCode) {
        alert("Access Denied! Redirecting to home.");
        window.location.href = "index.html";
      } else {
        alert("Access Granted ✅");
      }
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error retrieving code:", error);
  }
}

// Run check
getCode();

const firebaseConfig = {
  apiKey: "AIzaSyCxOqQolYSChdUEmR3Fwkvygxzr53pueUM",
  authDomain: "smartexpiry-efa33.firebaseapp.com",
  projectId: "smartexpiry-efa33",
  storageBucket: "smartexpiry-efa33.appspot.com",
  messagingSenderId: "891813623072",
  appId: "1:891813623072:web:a40ebb16aafe1d295e1345"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
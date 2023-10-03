import firebase from "firebase";

let messaging = null;
let storage = null;

const config = {
  apiKey: "AIzaSyBy14U3s5A0fHmHlFPWDcXGcShaYxmmqic",
  authDomain: "deelzat-76871.firebaseapp.com",
  databaseURL: "https://deelzat-76871.firebaseio.com",
  projectId: "deelzat-76871",
  storageBucket: "deelzat-76871.appspot.com",
  messagingSenderId: "196799824624",
  appId: "1:196799824624:web:c8bc52ce28fb06d4c33835",
  measurementId: "G-1YX62365BR"
};

// Initialize Firebase
firebase.initializeApp(config);

if (firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
}


export default firebase;
export { messaging }

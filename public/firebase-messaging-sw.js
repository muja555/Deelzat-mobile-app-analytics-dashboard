importScripts("https://www.gstatic.com/firebasejs/8.7.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.7.1/firebase-messaging.js");
const firebaseConfig = {
     apiKey: "AIzaSyBy14U3s5A0fHmHlFPWDcXGcShaYxmmqic",
       authDomain: "deelzat-76871.firebaseapp.com",
       databaseURL: "https://deelzat-76871.firebaseio.com",
       projectId: "deelzat-76871",
       storageBucket: "deelzat-76871.appspot.com",
       messagingSenderId: "196799824624",
       appId: "1:196799824624:web:c8bc52ce28fb06d4c33835",
       measurementId: "G-1YX62365BR"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
console.log("lalalalalalallaa 1");
messaging.setBackgroundMessageHandler(function(payload) {
console.log("lalalalalalallaa ", payload);
     const promiseChain = clients
          .matchAll({
               type: "window",
               includeUncontrolled: true,
          })
          .then((windowClients) => {
               for (let i = 0; i < windowClients.length; i++) {
                    const windowClient = windowClients[i];
                    windowClient.postMessage(payload);
               }
          })
          .then(() => {
               return registration.showNotification("my notification title");
          });
     return promiseChain;
});
console.log("lalalalalalallaa 2");
self.addEventListener("notificationclick", function(event) {
     console.log(event);
});
self.addEventListener('message', function(event) {
   console.log("lalalalalalallaa 3");
  event.ports[0].postMessage({'test': 'This is my response.'});
});

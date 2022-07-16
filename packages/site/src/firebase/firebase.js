import firebase from "firebase";

// Initialize Firebase
const config = {
/* my config */
  apiKey: "AIzaSyD2HxRtdOMcxwa7ltdO9WuyuYAEjSH91a4",
  authDomain: "nft-virtuoso.firebaseapp.com",
  projectId: "nft-virtuoso",
  storageBucket: "nft-virtuoso.appspot.com",
  databaseURL: "https://nft-virtuoso-default-rtdb.firebaseio.com/",
  messagingSenderId: "811121518425",
  appId: "1:811121518425:web:77776d0df0f60b53428e48",
  measurementId: "G-XCXVREP0W6"


/*


  apiKey: "AIzaSyAz-GPfA-hN74oFh3XvXsF9vQrlE5xpU10",
  authDomain: "wieldy-4f59c.firebaseapp.com",
  databaseURL: "https://wieldy-4f59c.firebaseio.com",
  projectId: "wieldy-4f59c",
  storageBucket: "wieldy-4f59c.appspot.com",
  messagingSenderId: "81949884261"
*/
};

firebase.initializeApp(config);
// const analytics = firebase.analytics();
// const analytics = getAnalytics(app);
const database = firebase.database();

export {
  database,
};

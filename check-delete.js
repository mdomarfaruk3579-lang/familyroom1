import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

// Need to run this as a client to test rules? We can't easily authenticate as the user in a node script.

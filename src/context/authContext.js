import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  arrayUnion,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

const auth = getAuth();

const initialDrinks = [
  { name: "Beer", litres: "0.5", ABV: "4.7", type: "beer" },
  { name: "Wine", litres: "0.25", ABV: "12.5", type: "wine" },
  { name: "Booze", litres: "0.04", ABV: "40", type: "booze" },
  { name: "Drink", litres: "0.04", ABV: "40", type: "drink" },
];


export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        updateUserData(user.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateUserData = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        let data = docSnap.data();
        setUser((prevUser) => ({
          ...prevUser,
          username: data.username,
          id: userId,
          gender: data.gender,
          weight: data.weight,
          email: data.email,
        }));
      }
    } catch (error) {
      console.error("Error updating user data: ", error.message);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      setUser(response.user);
    } catch (error) {
      let message = error.message;

      if (message.includes("(auth/invalid-email)")) {
        message = "Invalid email";
      }

      if (message.includes("(auth/invalid-credential")) {
        message = "Wrong credentials";
      }
      return { success: false, message: message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username, email, gender, weight, password) => {
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
  
      await setDoc(doc(db, "users", response.user.uid), {
        username: username,
        email: email,
        userId: response.user.uid,
        gender: gender,
        weight: weight,
        drinks: [],  
        currentSessions: [],
        endedSessions: [],
      });

      for (let drink of initialDrinks) {
        const drinkDocRef = await addDoc(collection(db, "drinks"), {
          name: drink.name,
          litres: drink.litres,
          alcohol: drink.ABV,
          type: drink.type,
        });
  
        const userDocRef = doc(db, "users", response.user.uid);
  
        await updateDoc(userDocRef, {
          drinks: arrayUnion(doc(db, "drinks", drinkDocRef.id)),
        });
      }
  
      setUser(response.user);
      updateUserData(response.user.uid);
  
    } catch (error) {
      let message = error.message;
      if (message.includes("(auth/invalid-email)")) {
        message = "Invalid email";
      }
      if (
        message.includes("(auth/invalid-password)") ||
        message.includes("(auth/weak-password)")
      ) {
        message = "Invalid password";
      }
  
      if (message.includes("(auth/email-already-in-use")) {
        message = "Email already in use";
      }
      return { success: false, message: message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (newUsername, newGender, newWeight) => {
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.id);

      await updateDoc(userDocRef, {
        username: newUsername,
        gender: newGender,
        weight: newWeight,
      });

      await updateUserData(user.id);

      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const currentSessionsRefs = userData?.currentSessions || [];

      const updatePromises = currentSessionsRefs.map(async (sessionRef) => {
        const sessionDocRef = doc(db, "sessions", sessionRef.id);
        const sessionDoc = await getDoc(sessionDocRef);

        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          const usersCollectionRef = collection(sessionDocRef, "users");
          const usersQuerySnapshot = await getDocs(usersCollectionRef);

          const userUpdatePromises = usersQuerySnapshot.docs.map(
            async (docSnap) => {
              if (docSnap.exists()) {
                const sessionUser = docSnap.data();
                if (sessionUser.userId === user.id) {
                  await updateDoc(docSnap.ref, {
                    username: newUsername,
                    gender: newGender,
                    weight: newWeight,
                  });
                }
              }
            }
          );

          await Promise.all(userUpdatePromises);
        } 
      });

      await Promise.all(updatePromises);

      return { success: true, message: "User data successfully updated" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut_ = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setEmail(null);
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      return {
        success: true,
        message: "Password reset mail sent to " + user.email,
      };
    } catch (error) {
      let message = error.message;

      if (message.includes("(auth/invalid-email)")) {
        message = "Invalid email";
      }

      return { success: false, message: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut_,
        updateUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

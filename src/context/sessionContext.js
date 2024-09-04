import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useAuthContext } from "../context/authContext";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  Timestamp,
  getDoc,
  getDocs,
  deleteDoc,
  arrayUnion,
  setDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { calculateBAC } from "../utilities/BACutilities";

const SessionContext = createContext();

export const useSessionContext = () => {
  return useContext(SessionContext);
};

export const SessionContextProvider = ({ children }) => {
  const { user } = useAuthContext();

  const [fetchSessionLoading, setFetchSessionsLoading] = useState(false);
  const [updateSessionLoading, setEditSessionLoading] = useState(false);
  const [joinSessionLoading, setJoinSessionLoading] = useState(false);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);

  const createSession = async (sessionName) => {
    setCreateSessionLoading(true);
    try {
      const sessionDocRef = await addDoc(collection(db, "sessions"), {
        name: sessionName,
        host: user.id,
        startedAt: Timestamp.now(),
        endedAt: null,
      });

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        currentSessions: arrayUnion(doc(db, "sessions", sessionDocRef.id)),
      });

      const usersSubcollectionRef = collection(
        doc(db, "sessions", sessionDocRef.id),
        "users"
      );
      await setDoc(doc(usersSubcollectionRef, user.id), {
        userId: user.id,
        username: user.username,
        gender: user.gender,
        weight: user.weight,
        joinedAt: Timestamp.now(),
      });

      return { success: true, message: "Session created" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setCreateSessionLoading(false);
    }
  };

  const joinSession = async (sessionId) => {
    setJoinSessionLoading(true);
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const sessionDocSnap = await getDoc(sessionDocRef);

      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session does not exist" };
      }
      if (sessionDocSnap.data().endedAt !== null) {
        return { success: false, message: "Session has already ended" };
      }

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        currentSessions: arrayUnion(sessionDocRef),
      });

      const usersSubcollectionRef = collection(sessionDocRef, "users");
      await setDoc(doc(usersSubcollectionRef, user.id), {
        userId: user.id,
        username: user.username,
        gender: user.gender,
        weight: user.weight,
        joinedAt: Timestamp.now(),
      });

      return { success: true, message: "Session joined" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setJoinSessionLoading(false);
    }
  };

  const endSession = async (sessionId) => {
    setEditSessionLoading(true);
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const sessionDocSnap = await getDoc(sessionDocRef);

      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session does not exist" };
      }

      const usersSubcollectionRef = collection(sessionDocRef, "users");
      const usersSnapshot = await getDocs(usersSubcollectionRef);
      const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
        const userRef = doc(db, "users", userDoc.data().userId);
        return updateDoc(userRef, {
          currentSessions: arrayRemove(sessionDocRef),
          endedSessions: arrayUnion(sessionDocRef),
        });
      });

      await Promise.all(updatePromises);

      await updateDoc(sessionDocRef, {
        endedAt: Timestamp.now(),
      });

      return { success: true, message: "Session ended" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  const leaveSession = async (sessionId) => {
    setEditSessionLoading(true);
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const userDocRefInSession = doc(
        collection(sessionDocRef, "users"),
        user.id
      );

      const drinksSubcollectionRef = collection(userDocRefInSession, "drinks");
      const drinksQuerySnapshot = await getDocs(drinksSubcollectionRef);
      const deletePromises = drinksQuerySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      await deleteDoc(userDocRefInSession);

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        currentSessions: arrayRemove(sessionDocRef),
      });

      return { success: true, message: "Session left" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    setEditSessionLoading(true);
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);

      const sessionDocSnap = await getDoc(sessionDocRef);
      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session does not exist" };
      }

      const usersSubcollectionRef = collection(sessionDocRef, "users");
      const usersSnapshot = await getDocs(usersSubcollectionRef);

      const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.data().userId;
        const userRef = doc(db, "users", userId);
        return updateDoc(userRef, {
          endedSessions: arrayRemove(sessionDocRef),
        });
      });

      await Promise.all(updatePromises);
      await deleteDoc(sessionDocRef);

      return { success: true, message: "Session deleted" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        fetchSessionLoading,
        updateSessionLoading,
        createSessionLoading,
        joinSessionLoading,
        createSession,
        joinSession,
        endSession,
        leaveSession,
        deleteSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

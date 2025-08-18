import React, {
  createContext,
  useContext,
  useState,
} from "react";
import { useAuthContext } from "../context/authContext";
import {
  collection,
  doc,
  addDoc,
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

const SessionContext = createContext();

export const useSessionContext = () => {
  try {
    return useContext(SessionContext);
  } catch (error) {
    console.error("Error in useSessionContext: ", error.message);
  }
};

export const SessionContextProvider = ({ children }) => {
  const { user } = useAuthContext();

  const [fetchSessionLoading, setFetchSessionsLoading] = useState(false);
  const [updateSessionLoading, setUpdateSessionLoading] = useState(false);
  const [editSessionLoading, setEditSessionLoading] = useState(false);
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
      });

      return { success: true, message: "Session created" };
    } catch (error) {
      console.error("Error in createSession: ", error.message);
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
      });

      return { success: true, message: "Session joined" };
    } catch (error) {
      console.error("Error in joinSession: ", error.message);
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
      console.error("Error in endSession: ", error.message);
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  const updateSession = async (sessionId, sessionName, sessionStartedAt) => {
    setUpdateSessionLoading(true);

    try {
      if (sessionStartedAt > Timestamp.now().toDate()) {
        return { success: false, message: "You cannot start session after the current time" };
      }

      const sessionDocRef = doc(db, "sessions", sessionId);
      const sessionDocSnap = await getDoc(sessionDocRef);

      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session does not exist" };
      }

      if (typeof sessionName !== "string" || !sessionName.trim()) {
        return { success: false, message: "Invalid session name" };
      }

      await updateDoc(sessionDocRef, {
        name: sessionName,
        startedAt: sessionStartedAt,
      });

      const usersSubcollectionRef = collection(sessionDocRef, "users");
      const userDocRef = doc(usersSubcollectionRef, user.id);

      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        return { success: false, message: "User does not exist in the session" };
      }

      return { success: true, message: "Session and user data updated successfully" };
    } catch (error) {
      console.error("Error in updateSession:", error.message);
      return { success: false, message: error.message };
    } finally {
      setUpdateSessionLoading(false);
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
      console.error("Error in leaveSession: ", error.message);
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    console.log("deleteSession called with sessionId:", sessionId);
    setEditSessionLoading(true);
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);

      const sessionDocSnap = await getDoc(sessionDocRef);
      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session does not exist" };
      }

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        endedSessions: arrayRemove(sessionDocRef),
      });

      return { success: true, message: "Session deleted" };
    } catch (error) {
      console.error("Error in deleteSession: ", error.message);
      return { success: false, message: error.message };
    } finally {
      setEditSessionLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        fetchSessionLoading,
        editSessionLoading,
        createSessionLoading,
        joinSessionLoading,
        updateSessionLoading,
        createSession,
        joinSession,
        endSession,
        updateSession,
        leaveSession,
        deleteSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuthContext } from "../context/authContext";
import {
  collection,
  doc,
  addDoc,
  Timestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const DrinkContext = createContext();

export const useDrinkContext = () => {
  return useContext(DrinkContext);
};

export const DrinkContextProvider = ({ children }) => {
  const { user } = useAuthContext();

  const [createDrinkLoading, setCreateDrinkLoading] = useState(false);
  const [updateDrinkLoading, setUpdateDrinkLoading] = useState(false);
  const [deleteDrinkLoading, setDeleteDrinkLoading] = useState(false);

  const createUserDrink = async (
    drinkName,
    drinkLitres,
    drinkABV,
    drinkType
  ) => {
    setCreateDrinkLoading(true);
    try {
      const drinkDocRef = await addDoc(collection(db, "drinks"), {
        name: drinkName,
        litres: drinkLitres,
        alcohol: drinkABV,
        type: drinkType,
      });

      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        drinks: arrayUnion(doc(db, "drinks", drinkDocRef.id)),
      });

      return { success: true, message: "User drink created" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setCreateDrinkLoading(false);
    }
  };

  const updateUserDrink = async (
    drinkId,
    newDrinkname,
    newDrinkLitres,
    newDrinkABV,
    newDrinkType
  ) => {
    setUpdateDrinkLoading(true);
    try {
      const drinkRef = doc(db, "drinks", drinkId);
      await updateDoc(drinkRef, {
        name: newDrinkname,
        alcohol: newDrinkABV,
        litres: newDrinkLitres,
        type: newDrinkType,
      });
      return { success: true, message: "User drink updated" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setUpdateDrinkLoading(false);
    }
  };

  const deleteUserDrink = async (drinkId) => {
    setDeleteDrinkLoading(true);
    try {
      const drinkRef = doc(db, "drinks", drinkId);
      await deleteDoc(drinkRef);
      return { success: true, message: "User drink deleted" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setDeleteDrinkLoading(false);
    }
  };

  const addSessionDrinkToCurrentSessions = async (drinkId) => {
    try {
      const drinkDocRef = doc(db, "drinks", drinkId);
      const drinkDocSnap = await getDoc(drinkDocRef);

      const drinkData = drinkDocSnap.data();
      const { name, alcohol, litres, type } = drinkData;

      const userDocRef = doc(db, "users", user.id);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      const sessionRefs = userData.currentSessions || [];
      if (sessionRefs.length === 0) {
        return { success: false, message: "No current sessions" };
      }

      for (const sessionRef of sessionRefs) {
        const sessionDocRef = doc(db, "sessions", sessionRef.id);
        const sessionUserDocRef = doc(sessionDocRef, "users", user.id);

        const drinkEntry = {
          name,
          alcohol,
          litres,
          type,
          drankAt: Timestamp.now(),
        };

        const drinksCollectionRef = collection(sessionUserDocRef, "drinks");

        await addDoc(drinksCollectionRef, drinkEntry);
      }

      return {
        success: true,
        message: "Drink added to all sessions",
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const addSessionDrinkToCurrentSession = async (drinkId, sessionId) => {
    try {
      const drinkDocRef = doc(db, "drinks", drinkId);
      const drinkDocSnap = await getDoc(drinkDocRef);

      const drinkData = drinkDocSnap.data();
      const { name, alcohol, litres, type } = drinkData;
      const sessionDocRef = doc(db, "sessions", sessionId);
      const sessionDocSnap = await getDoc(sessionDocRef);

      if (!sessionDocSnap.exists()) {
        return { success: false, message: "Session not found" };
      }

      const drinkEntry = {
        name,
        alcohol,
        litres,
        type,
        drankAt: Timestamp.now(),
      };

      const sessionUserDocRef = doc(sessionDocRef, "users", user.id);
      const drinksCollectionRef = collection(sessionUserDocRef, "drinks");

      await addDoc(drinksCollectionRef, drinkEntry);

      return {
        success: true,
        message: "Drink added to the session",
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const createSessionDrink = async (
  sessionId,
  drinkName,
  drinkLitres,
  drinkABV,
  drinkType,
  drinkDate
) => {
  try {
    setCreateDrinkLoading(true);

    const sessionDocRef = doc(db, "sessions", sessionId);
    const userDocRef = doc(sessionDocRef, "users", user.id);

    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { success: false, message: "User document does not exist" };
    }

    const userData = userDoc.data();
    const joinedAt = userData?.joinedAt?.toDate();

    const date = new Date(drinkDate);
    const timestamp = Timestamp.fromDate(date);

    if (timestamp < Timestamp.fromDate(new Date(joinedAt))) {
      return {
        success: false,
        message: "Time cannot be before you entered the session",
      };
    }

    if(timestamp > Timestamp.now()) {
      return {
        success: false,
        message: "Time cannot be after current time",
      };
    }

    const drinksCollectionRef = collection(userDocRef, "drinks");

    await addDoc(drinksCollectionRef, {
      name: drinkName,
      litres: drinkLitres,
      alcohol: drinkABV,
      type: drinkType,
      drankAt: drinkDate,
    });

    return { success: true, message: "Drink added to the session" };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    setCreateDrinkLoading(false);
  }
};
  
  const updateSessionDrink = async (
    sessionId,
    drinkId,
    newDrinkName,
    newDrinkLitres,
    newDrinkABV,
    newDrinkType,
    newDrinkDate
  ) => {
    setUpdateDrinkLoading(true);
    try {
      const date = new Date(newDrinkDate);
      const timestamp = Timestamp.fromDate(date);

      const userRef = doc(db, "sessions", sessionId, "users", user.id);
      const userDoc = await getDoc(userRef);

      const userData = userDoc.data();
      const joinedAt = userData?.joinedAt?.toDate();

      if (timestamp < Timestamp.fromDate(new Date(joinedAt))) {
        return {
          success: false,
          message: "Time cannot be before you entered the session",
        };
      }

      if(timestamp > Timestamp.now()) {
        return {
          success: false,
          message: "Time cannot be after current time",
        };
      }

      const drinkRef = doc(
        db,
        "sessions",
        sessionId,
        "users",
        user.id,
        "drinks",
        drinkId
      );

      await updateDoc(drinkRef, {
        name: newDrinkName,
        alcohol: newDrinkABV,
        litres: newDrinkLitres,
        type: newDrinkType,
        drankAt: timestamp,
      });

      return { success: true, message: "Session drink updated" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setUpdateDrinkLoading(false);
    }
  };

  const deleteSessionDrink = async (sessionId, drinkId) => {
    setDeleteDrinkLoading(true);

    try {
      const drinkRef = doc(
        db,
        "sessions",
        sessionId,
        "users",
        user.id,
        "drinks",
        drinkId
      );

      await deleteDoc(drinkRef);

      return { success: true, message: "Session drink deleted" };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setDeleteDrinkLoading(false);
    }
  };

  return (
    <DrinkContext.Provider
      value={{
        createDrinkLoading,
        updateDrinkLoading,
        deleteDrinkLoading,
        createUserDrink,
        updateUserDrink,
        deleteUserDrink,
        addSessionDrinkToCurrentSessions,
        addSessionDrinkToCurrentSession,
        createSessionDrink,
        updateSessionDrink,
        deleteSessionDrink,
      }}
    >
      {children}
    </DrinkContext.Provider>
  );
};

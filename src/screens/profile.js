import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { useAuthContext } from "../context/authContext";
import { db } from "../config/firebase";
import SessionItemComponent from "../components/sessionItem";
import { calculateBAC } from "../utilities/BACutilities";
const { width, height } = Dimensions.get("window");

import { theme } from "../styles/theme";

const ProfileScreen = () => {
  const { user } = useAuthContext();
  const [endedSessions, setEndedSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEndedSessions = useCallback(async () => {
    if (!user || !user.id) return;
  
    let sessionListeners = [];
    let sessionDataMap = new Map();
  
    const updateSessions = () => {
      setEndedSessions(
        Array.from(sessionDataMap.values()).filter((session) => session.endedAt)
      );
      setRefreshing(false);
      setLoading(false);
    };
  
    try {
      const userDocRef = doc(db, "users", user.id);
      const unsubscribeUserDoc = onSnapshot(userDocRef, async (userDocSnap) => {
        const userData = userDocSnap.data();
        const sessionRefs = userData?.endedSessions || [];
  
        const newEndedSessionRefs = new Set(sessionRefs.map((ref) => ref.id));
  
        sessionListeners.forEach((unsubscribe) => unsubscribe());
        sessionListeners = [];
        sessionDataMap = new Map();
  
        const sessionPromises = sessionRefs.map(async (sessionRef) => {
          const unsubscribeSessionDoc = onSnapshot(
            sessionRef,
            async (sessionDocSnap) => {
              if (sessionDocSnap.exists()) {
                const sessionData = {
                  id: sessionDocSnap.id,
                  ...sessionDocSnap.data(),
                };
  
                const usersSubcollectionRef = collection(sessionRef, "users");
                const usersSnapshot = await getDocs(usersSubcollectionRef);
  
                const users = [];
                const userListeners = [];
  
                usersSnapshot.forEach((userDocSnap) => {
                  const userData = {
                    id: userDocSnap.id,
                    ...userDocSnap.data(),
                    drinks: [],
                    userBAC: 0,
                  };
  
                  const drinksCollectionRef = collection(
                    userDocSnap.ref,
                    "drinks"
                  );
                  const unsubscribeDrinksCollection = onSnapshot(
                    drinksCollectionRef,
                    (drinksSnapshot) => {
                      const drinks = drinksSnapshot.docs.map((drinkDoc) => ({
                        id: drinkDoc.id,
                        ...drinkDoc.data(),
                      }));
  
                      const userBAC = calculateBAC(
                        userData,
                        drinks,
                        sessionData.endedAt
                      );
                      users.push({ ...userData, drinks, userBAC });
  
                      const totalBAC = users.reduce(
                        (acc, user) => acc + user.userBAC,
                        0
                      );
                      const sessionBAC =
                        users.length > 0 ? totalBAC / users.length : 0;
  
                      sessionDataMap.set(sessionData.id, {
                        ...sessionData,
                        sessionBAC,
                      });
                      updateSessions();
                    }
                  );
  
                  userListeners.push(unsubscribeDrinksCollection);
                });
  
                return () => {
                  userListeners.forEach((unsubscribe) => unsubscribe());
                };
              } else {
                sessionDataMap.delete(sessionRef.id);
                updateSessions();
              }
            }
          );
  
          sessionListeners.push(unsubscribeSessionDoc);
        });
  
        await Promise.all(sessionPromises);
  
        const deletedSessions = Array.from(sessionDataMap.keys()).filter(
          (sessionId) => !newEndedSessionRefs.has(sessionId)
        );
        deletedSessions.forEach((sessionId) => {
          sessionDataMap.delete(sessionId);
        });
  
        updateSessions();
      });
  
      return () => {
        unsubscribeUserDoc();
        sessionListeners.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      Alert.alert("Error fetching ended sessions", error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user, db]);
  

  
  useEffect(() => {
    fetchEndedSessions();
  }, [fetchEndedSessions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEndedSessions();
    setRefreshing(false);
  }, [fetchEndedSessions]);

  const renderSessionItem = ({ item: sessionItem }) => {
    return (
        <SessionItemComponent
          sessionId={sessionItem.id}
          sessionName={sessionItem.name}
          sessionEnded={true}
          sessionStartedAt={sessionItem.startedAt}
          sessionEndedAt={sessionItem.endedAt}
          sessionBAC={sessionItem.sessionBAC}
        />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={endedSessions}
        renderItem={renderSessionItem}
        keyExtractor={(sessionItem) => sessionItem.id}
        contentContainerStyle={styles.flatListContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={"white"}
            size={"large"}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.02,
  },
  sessionItem: {
    marginVertical: width * 0.02,
    width: width * 0.9,
  },
});

export default ProfileScreen;



import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { useAuthContext } from "../context/authContext";
import UserDrinkItemComponent from "../components/userDrinkItem";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { theme } from "../styles/theme";

const { height } = Dimensions.get("window");

const AddSessionDrinkScreen = ({ route }) => {
  const { sessionId, sessionHost } = route.params;

  const navigation = useNavigation();

  const { user } = useAuthContext();
  const [userDrinks, setUserDrinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();

        const sessionEndedAt = sessionData.endedAt;
        if (sessionEndedAt !== null && sessionHost !== user.id) {
          navigation.navigate("SessionFeed");
          Alert.alert("Session Ended", "Session has ended");
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, navigation]);

  const fetchUserDrinks = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const userDocRef = doc(db, "users", user.id);

      const unsubscribeUserDoc = onSnapshot(userDocRef, async (userDocSnap) => {
        const userData = userDocSnap.data();
        const drinksRef = userData?.drinks || [];

        setUserDrinks([]);

        if (drinksRef.length === 0) {
          setLoading(false);
          return;
        }

        const drinkListeners = new Map();

        drinksRef.forEach((ref) => {
          const unsubscribe = onSnapshot(ref, (drinkDocSnap) => {
            if (drinkDocSnap.exists()) {
              const drinkData = {
                id: drinkDocSnap.id,
                ...drinkDocSnap.data(),
              };

              setUserDrinks((prevDrinks) => {
                const updatedDrinks = prevDrinks.filter(
                  (drink) => drink.id !== drinkData.id
                );
                return [...updatedDrinks, drinkData];
              });
            } else {
              setUserDrinks((prevDrinks) => {
                return prevDrinks.filter((drink) => drink.id !== ref.id);
              });
            }
          });

          drinkListeners.set(ref.id, unsubscribe);
        });

        setLoading(false);

        return () => {
          drinkListeners.forEach((unsubscribe) => unsubscribe());
          unsubscribeUserDoc();
        };
      });

      return () => {
        unsubscribeUserDoc();
      };
    } catch (error) {
      console.error("Error fetching drinks:", error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserDrinks();
  }, [fetchUserDrinks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserDrinks();
    setRefreshing(false);
  }, [fetchUserDrinks]);

  const renderDrinkItem = ({ item: drinkItem }) => (
    <UserDrinkItemComponent
      drinkId={drinkItem.id}
      drinkName={drinkItem.name}
      drinkLitres={drinkItem.litres}
      drinkABV={drinkItem.alcohol}
      drinkType={drinkItem.type}
      sessionId={sessionId}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userDrinks}
        renderItem={renderDrinkItem}
        keyExtractor={(drinkItem) => drinkItem.id}
        numColumns={1}
        contentContainerStyle={styles.flatListContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={"white"}
            size={"small"}
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
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.02,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});

export default AddSessionDrinkScreen;

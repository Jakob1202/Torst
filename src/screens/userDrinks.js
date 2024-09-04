import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useAuthContext } from "../context/authContext";
import UserDrinkItemComponent from "../components/userDrinkItem";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const UserDrinksScreen = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [userDrinks, setUserDrinks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

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
      sessionId={null}
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("CreateUserDrink")}
        >
          <MaterialIcons
            name="add"
            size={iconSize}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    alignItems: "center",
  },
  button: {
    backgroundColor: theme.colors.secondary,
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: (width * 0.15) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});

export default UserDrinksScreen;

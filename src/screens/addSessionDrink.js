import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useAuthContext } from "../context/authContext";
import UserDrinkItemComponent from "../components/userDrinkItem";
import { useNavigation } from "@react-navigation/native";
import SwitchSelector from "react-native-switch-selector";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const AddSessionDrinkScreen = ({ route }) => {
  const { sessionId, sessionHost } = route.params;

  const navigation = useNavigation();

  const { user } = useAuthContext();

  const [userDrinks, setUserDrinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSort, setSelectedSort] = useState("bac");
  const [selectedTypes, setSelectedTypes] = useState([]);

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(
      sessionDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const sessionData = docSnap.data();

          const sessionEndedAt = sessionData.endedAt;
          if (sessionEndedAt !== null && sessionHost !== user.id) {
            navigation.navigate("SessionFeed");
            Alert.alert("Session Ended", "Session has ended");
          }
        }
      },
      (error) => {
        console.error("Error fetching session data: ", error);
      }
    );

    return () => unsubscribe();
  }, [sessionId, navigation]);


  const sortedUserDrinks = useMemo(() => {
    const filteredDrinks = userDrinks.filter((drink) =>
      selectedTypes.length === 0 || selectedTypes.includes(drink.type)
    );

    return filteredDrinks.sort((a, b) => {
      if (selectedSort === "bac") {
        return parseFloat(b.alcohol) - parseFloat(a.alcohol);
      } else {
        return parseFloat(b.litres) - parseFloat(a.litres);
      }
    });
  }, [userDrinks, selectedSort, selectedTypes]);

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
      console.error("Error in fetchUserDrinks:", error.message);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>

        <View style={styles.filterContainer}>
          <View style={styles.switchContainer}>
            <SwitchSelector
              initial={0}
              textColor={theme.colors.text}
              selectedColor={theme.colors.text}
              buttonColor={theme.colors.secondary}
              borderColor={theme.colors.secondary}
              backgroundColor={theme.colors.background}
              hasPadding
              options={[
                {
                  label: <Feather name="percent" size={iconSize * 0.8} color="white" />,
                  value: "bac",
                },
                {
                  label: <Feather name="droplet" size={iconSize * 0.8} color="white" />,
                  value: "grams",
                },
              ]}
              onPress={(value) => setSelectedSort(value)}
              style={styles.switchSelector}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("CreateSessionDrink", {
                sessionId,
              })
            }
          >
            <MaterialIcons
              name="add"
              size={iconSize}
              color={theme.colors.button}
            />
          </TouchableOpacity>

        </View>
        <FlatList
          data={sortedUserDrinks}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.01,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: width * 0.025,
  },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  switchSelector: {
    marginTop: height * 0.01,
    width: width * 0.4,
    height: height * 0.05,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    width: width * 0.15,
    height: width * 0.1,
    marginTop: height * 0.01,
    borderRadius: (width * 0.1) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
});

export default AddSessionDrinkScreen;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import SwitchSelector from "react-native-switch-selector";
import PieChart from 'react-native-pie-chart'
import { useAuthContext } from "../context/authContext";
import UserDrinkItemComponent from "../components/userDrinkItem";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from '@expo/vector-icons/Feather';
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const widthAndHeight = width * 0.5

const iconSize = width * 0.1;

const UserDrinksScreen = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [userDrinks, setUserDrinks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [drinksConsumedFiltered, setDrinksConsumedFiltered] = useState([]);

  const [selectedSort, setSelectedSort] = useState("bac");
  const [selectedTypes, setSelectedTypes] = useState([]);

  const navigation = useNavigation();

  const iconsColorMap = {
    beer_bottle: "#FF7043",
    beer_glass: "#FFB74D",
    beer_can: "#D84315",
    wine: "#BA68C8",
    booze: "#66BB6A",
    drink: "#FFD54F"
  };

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
    setLoading(true);
    if (!user || !user.id) return;


    try {
      const userDocRef = doc(db, "users", user.id);

      const unsubscribeUserDoc = onSnapshot(userDocRef, async (userDocSnap) => {
        const userData = userDocSnap.data();

        if (!userData) {
          console.error("User data is not found.");
          return;
        }

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
      });

    } catch (error) {
      console.error("Error fetching user data", error.message);
    } finally {
      setLoading(false);
    }
  }, [user, db]);

  useEffect(() => {
    fetchUserDrinks();
  }, [fetchUserDrinks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserDrinks();
    setRefreshing(false);
  }, [fetchUserDrinks]);

  const formatDataForBarChart = (drinksConsumedFiltered) =>
    Object.keys(drinksConsumedFiltered).map((drink) => ({
      value: drinksConsumedFiltered[drink],
      color: iconsColorMap[drink],
    }));

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>

        <View style={styles.drinkDataContainer}>
          {Object.values(drinksConsumedFiltered).some(value => value > 0) ? (
            <View style={styles.chartRow}>
              <View style={styles.column}>
                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["beer_can"] }]}
                    source={require("../../assets/icons/beer_can.png")}
                  />
                </View>

                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["beer_glass"] }]}
                    source={require("../../assets/icons/beer_glass.png")}
                  />
                </View>

                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["beer_bottle"] }]}
                    source={require("../../assets/icons/beer_bottle.png")}
                  />
                </View>
              </View>

              <View style={styles.chartContainer}>
                {(() => {
                  const chartData = formatDataForBarChart(drinksConsumedFiltered);
                  return (
                    <PieChart
                      widthAndHeight={widthAndHeight}
                      series={chartData}
                      cover={0.7}
                      style={styles.chart}
                    />
                  );
                })()}
              </View>

              <View style={styles.column}>
                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["wine"] }]}
                    source={require("../../assets/icons/wine.png")}
                  />
                </View>

                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["booze"] }]}
                    source={require("../../assets/icons/booze_large.png")}
                  />
                </View>

                <View style={styles.row}>
                  <Image
                    style={[styles.icon, { tintColor: iconsColorMap["drink"] }]}
                    source={require("../../assets/icons/drink.png")}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </View>

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
                  label: <Feather name="percent" size={iconSize * 0.7} color="white" />,
                  value: "bac",
                },
                {
                  label: <Feather name="droplet" size={iconSize * 0.7} color="white" />,
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
              navigation.navigate("CreateUserDrink")
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
              size={"large"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  drinkDataContainer: {
    marginLeft: -width * 0.025,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.025,
  },
  icon: {
    width: width * 0.125,
    height: width * 0.125,
  },
  unit: {
    fontSize: width * 0.075,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: width * 0.025,
    marginTop: height * 0.01,
  },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  switchSelector: {
    marginTop: height * 0.01,
    width: width * 0.335,
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
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.01,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  column: {
    marginHorizontal: width * 0.05,
  },
});

export default UserDrinksScreen;


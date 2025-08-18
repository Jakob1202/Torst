import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Text,
  Image,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
} from "firebase/firestore";
import PieChart from 'react-native-pie-chart'
import SwitchSelector from "react-native-switch-selector";
import { useAuthContext } from "../context/authContext";
import { db } from "../config/firebase";
import SessionItemComponent from "../components/sessionItem";
import {
  calculateBAC,
  calculateTotalAlcoholGrams,
  getBACDataPoints,
  isSessionBACTrending,
  calculateDrinkCounts,
} from "../utilities/BACutilities";
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import { theme } from "../styles/theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get("window");

const widthAndHeight = width * 0.5

const iconSize = width * 0.1;

const ProfileScreen = () => {
  const { user } = useAuthContext();

  const [endedSessions, setEndedSessions] = useState([]);
  const [drinksConsumedFiltered, setDrinksConsumedFiltered] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedSort, setSelectedSort] = useState("date");

  const [maxBAC, setMaxBAC] = useState(0);
  const [minBAC, setMinBAC] = useState(0);
  const [averageBAC, setAverageBAC] = useState(0);

  const iconsColorMap = {
    beer_bottle: "#F06292",
    beer_glass: "#FFEB3B",
    beer_can: "#8E24AA",
    wine: "#4FC3F7",
    booze: "#81C784",
    drink: "#FF8A65"
  };

  const [showText, setShowText] = useState({
    wine: false,
    booze: false,
    drink: false,
    beer_can: false,
    beer_glass: false,
  });

  const toggleView = (type) => {
    setShowText((prevState) => ({
      ...prevState,
      [type]: !prevState[type],
    }));
  };


  const sortedEndedSessions = useMemo(() => {
    return endedSessions.sort((a, b) => {
      if (selectedSort === "date") {
        return b.endedAt - a.endedAt;
      } else if (selectedSort === "grams") {
        return b.sessionTotalAlcoholGrams - a.sessionTotalAlcoholGrams;
      } else if (selectedSort === "users") {
        return b.users - a.users;
      } else {
        return 0;
      }
    });
  }, [endedSessions, selectedSort]);

  const fetchEndedSessions = useCallback(async () => {
    if (!user || !user.id) return;

    let sessionListeners = [];
    let sessionDataMap = new Map();
    let allDrinks = [];

    const updateSessions = () => {
      const activeSessions = Array.from(sessionDataMap.values()).filter(
        (session) => session.endedAt
      );

      const allBACDataPoints = activeSessions.flatMap(session =>
        session.sessionAverageBACDataPoints.map(({ average }) => average)
      );

      const { averageBAC, maxBAC, minBAC } = calculateBACStats(allBACDataPoints);

      setEndedSessions(activeSessions);
      setAverageBAC(averageBAC);
      setMaxBAC(maxBAC);
      setMinBAC(minBAC);
      setRefreshing(false);
      setLoading(false);
    };

    const calculateBACStats = (bacDataPoints) => {
      const validBACDataPoints = bacDataPoints.filter((bac) => typeof bac === "number" && !isNaN(bac));

      if (validBACDataPoints.length === 0) return { averageBAC: 0, maxBAC: 0, minBAC: 0 };

      const totalBAC = validBACDataPoints.reduce((sum, bac) => sum + bac, 0);
      const averageBAC = totalBAC / validBACDataPoints.length;
      const maxBAC = Math.max(...validBACDataPoints);
      const minBAC = Math.min(...validBACDataPoints.filter((bac) => bac > 0));

      return { averageBAC, maxBAC, minBAC };
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
                let sessionTotalAlcoholGrams = 0;
                let sessionTotalUsers = usersSnapshot.size;
                let userBACDataPoints = new Map();
                let userDrinks = [];

                usersSnapshot.forEach((userDocSnap) => {
                  if (userDocSnap.id === user.id) {
                    const drinksCollectionRef = collection(userDocSnap.ref, "drinks");
                    const unsubscribeDrinksCollection = onSnapshot(
                      drinksCollectionRef,
                      (drinksSnapshot) => {
                        userDrinks = drinksSnapshot.docs.map((drinkDoc) => ({
                          id: drinkDoc.id,
                          ...drinkDoc.data(),
                        }));

                        allDrinks.push(userDrinks);

                        const consumedDrinksFiltered = calculateDrinkCounts(allDrinks);
                        setDrinksConsumedFiltered(consumedDrinksFiltered);
                        updateSessions();
                      }
                    );
                    userListeners.push(unsubscribeDrinksCollection);
                  }
                });

                const userPromises = usersSnapshot.docs.map(async (userDocSnap) => {
                  const userData = {
                    id: userDocSnap.id,
                    ...userDocSnap.data(),
                    drinks: [],
                    userBAC: 0,
                  };

                  const drinksCollectionRef = collection(userDocSnap.ref, "drinks");
                  let drinks = []
                  const unsubscribeDrinksCollection = onSnapshot(
                    drinksCollectionRef,
                    (drinksSnapshot) => {
                      drinks = drinksSnapshot.docs
                        .map((drinkDoc) => ({
                          id: drinkDoc.id,
                          ...drinkDoc.data(),
                        }))
                        .sort((a, b) => (a.drankAt?.seconds || 0) - (b.drankAt?.seconds || 0));

                      const userBAC = calculateBAC(userData, drinks, sessionData.endedAt);
                      sessionTotalAlcoholGrams += calculateTotalAlcoholGrams(
                        drinks,
                        sessionData.endedAt
                      );

                      if (userDocSnap.id === user.id) {
                        if (drinks && drinks.length >= 2) {
                          userBACDataPoints = getBACDataPoints(
                            userData,
                            drinks,
                            drinks[0].drankAt || sessionData.startedAt,
                            sessionData.endedAt
                          );
                        } else {
                          userBACDataPoints = getBACDataPoints(
                            userData,
                            [],
                            sessionData.startedAt,
                            sessionData.endedAt
                          );
                        }
                      }

                      users.push({
                        ...userData,
                        drinks,
                        userBAC,
                      });

                      userListeners.push(unsubscribeDrinksCollection);

                      const sessionAverageBACDataPoints = Array.from(
                        userBACDataPoints.entries()
                      ).map(([timestampString, value]) => ({
                        timestamp: new Date(timestampString),
                        average: value,
                      }));

                      sessionAverageBACDataPoints.sort(
                        (a, b) => a.timestamp - b.timestamp
                      );

                      const sessionBAC = userBAC;
                      const sessionIsTrending = isSessionBACTrending(sessionAverageBACDataPoints);

                      sessionDataMap.set(sessionData.id, {
                        ...sessionData,
                        sessionBAC,
                        sessionTotalAlcoholGrams,
                        sessionTotalUsers,
                        users,
                        sessionAverageBACDataPoints,
                        isTrending: sessionIsTrending,
                      });

                      updateSessions();
                    }
                  );
                });

                await Promise.all(userPromises);
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

  const formatDataForBarChart = (drinksConsumedFiltered) =>
    Object.keys(drinksConsumedFiltered).map((drink) => ({
      value: drinksConsumedFiltered[drink],
      color: iconsColorMap[drink],
    }));

  const renderSessionItem = ({ item: sessionItem }) => {
    return (
      <SessionItemComponent
        sessionId={sessionItem.id}
        sessionName={sessionItem.name}
        sessionHost={sessionItem.host}
        sessionStartedAt={sessionItem.startedAt}
        sessionEndedAt={sessionItem.endedAt}
        sessionEnded={true}
        sessionSort={selectedSort}
        sessionBAC={sessionItem.sessionBAC}
        sessionTotalAlcoholGrams={sessionItem.sessionTotalAlcoholGrams}
        sessionTotalUsers={sessionItem.sessionTotalUsers}
        sessionTrending={sessionItem.isTrending}
        sessionUsers={sessionItem.sessionTotalUsers}
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
                  <TouchableOpacity onPress={() => toggleView("beer_can")}>
                    {showText.beer_can ? (
                      <Text style={[styles.text, { color: iconsColorMap["beer_can"] }]}>
                        {drinksConsumedFiltered["beer_can"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["beer_can"] }]}
                        source={require("../../assets/icons/beer_can.png")}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => toggleView("beer_glass")}>
                    {showText.beer_glass ? (
                      <Text style={[styles.text, { color: iconsColorMap["beer_glass"] }]}>
                        {drinksConsumedFiltered["beer_glass"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["beer_glass"] }]}
                        source={require("../../assets/icons/beer_glass.png")}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => toggleView("beer_bottle")}>
                    {showText.beer_bottle ? (
                      <Text style={[styles.text, { color: iconsColorMap["beer_bottle"] }]}>
                        {drinksConsumedFiltered["beer_bottle"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["beer_bottle"] }]}
                        source={require("../../assets/icons/beer_bottle.png")}
                      />
                    )}
                  </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => toggleView("wine")}>
                    {showText.wine ? (
                      <Text style={[styles.text, { color: iconsColorMap["wine"] }]}>
                        {drinksConsumedFiltered["wine"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["wine"] }]}
                        source={require("../../assets/icons/wine.png")}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => toggleView("booze")}>
                    {showText.booze ? (
                      <Text style={[styles.text, { color: iconsColorMap["booze"] }]}>
                        {drinksConsumedFiltered["booze"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["booze"] }]}
                        source={require("../../assets/icons/booze_large.png")}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => toggleView("drink")}>
                    {showText.drink ? (
                      <Text style={[styles.text, { color: iconsColorMap["drink"] }]}>
                        {drinksConsumedFiltered["drink"] || 0}
                      </Text>
                    ) : (
                      <Image
                        style={[styles.icon, { tintColor: iconsColorMap["drink"] }]}
                        source={require("../../assets/icons/drink.png")}
                      />
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.sessionDataCointainer}>
          <View style={styles.statsContainer}>

            <View style={styles.row}>
              <Text style={[styles.stat, { color: theme.colors.red }]}>{minBAC.toFixed(2) + " ‰"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={[styles.stat, { color: '#FFD700' }]}>{averageBAC.toFixed(2) + " ‰"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={[styles.stat, { color: theme.colors.green }]}>{maxBAC.toFixed(2) + " ‰"}</Text>
            </View>

          </View>

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
                { label: <MaterialIcons name="date-range" size={iconSize * 0.7} color="white" />, value: "date" },
                { label: <Feather name="droplet" size={iconSize * 0.7} color="white" />, value: "grams" },
                { label: <Octicons name="person" size={iconSize * 0.7} color="white" />, value: "users" },
              ]}
              onPress={(value) => setSelectedSort(value)}
              style={styles.switchSelector}
              textStyle={{
                fontSize: width * 0.04,
                fontWeight: "bold",
              }}
              selectedTextStyle={{
                fontSize: width * 0.04,
                fontWeight: "bold",
                color: theme.colors.text,
              }}
            />
          </View>
        </View>

        <FlatList
          data={sortedEndedSessions}
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
    </KeyboardAvoidingView >
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginTop: height * 0.02,
    marginHorizontal: width * 0.025,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: width * 0.075,
    height: width * 0.075,
  },
  stat: {
    fontSize: width * 0.06,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  selectedSort: {
    fontSize: width * 0.05,
    color: "#FFD700",
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
  },
  switchSelector: {
    marginTop: height * 0.01,
    width: width * 0.5,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: width * 0.075,
    height: width * 0.075,
  },
  units: {
    fontSize: width * 0.075,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.01,
  },
  text: {
    fontSize: width * 0.10,
    fontWeight: "bold",
    marginLeft: width * 0.025,
  },
  sessionItem: {
    marginVertical: width * 0.02,
    width: width * 0.9,
  },
  drinkDataContainer: {
    marginTop: height * 0.01,
    marginLeft: -width * 0.035,
  },
  chart: {
    marginTop: height * 0.025,
    borderColor: theme.colors.secondary,
  },
  chartConfig: {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    formatYLabel: (value) => `${value}`,
    fillShadowGradient: theme.colors.background,
    fillShadowGradientOpacity: 0,
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    propsForDots: {
      r: "0",
    },
    barPercentage: 1,
    propsForLabels: {
      fontSize: height * 0.0125,
      fontWeight: "bold",
      color: 'rgba(255, 255, 255, 0.7)',
    },
    axisLabelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForBars: {
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1,
    },
  },
  column: {
    marginHorizontal: width * 0.05,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.025,
  },
  text: {
    fontSize: width * 0.10,
    fontWeight: "bold",
    marginLeft: width * 0.025,
  },
  icon: {
    width: width * 0.125,
    height: width * 0.125,
  },
  sessionDataCointainer: {
    width: width * 1,
  }
});

export default ProfileScreen;

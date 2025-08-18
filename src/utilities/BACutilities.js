import { Timestamp } from "firebase/firestore";

const MALE_RATIO = 0.7;
const FEMALE_RATIO = 0.6;
const GRAMS_PER_LITRE = 1000;
const ALCOHOL_DENSITY = 0.789;
const METABOLISM_RATE = 0.15;

const DESIRED_NUMBER_POINTS = 20;

const INITIAL_DRINKS = [
  { name: "Beer (0.5l)", litres: "0.5", ABV: "4.7", type: "beer_can" },
  { name: "Beer (0.4l)", litres: "0.4", ABV: "4.7", type: "beer_glass" },
  { name: "Beer (0.33l)", litres: "0.33", ABV: "4.7", type: "beer_bottle" },
  { name: "Wine", litres: "0.25", ABV: "12.5", type: "wine" },
  { name: "Booze", litres: "0.04", ABV: "40", type: "booze" },
  { name: "Drink", litres: "0.04", ABV: "40", type: "drink" },
];

export const calculateBAC = (user, drinks, time) => {
  if (drinks.length === 0 || user == null || drinks == null || time == null) {
    return 0;
  }

  const alcoholRatio = user.gender === "male" ? MALE_RATIO : FEMALE_RATIO;

  let totalAlcoholGrams = 0;

  const sortedDrinks = drinks.sort(
    (a, b) =>
      a.drankAt.seconds * 1000 + a.drankAt.nanoseconds / 1e6 -
      (b.drankAt.seconds * 1000 + b.drankAt.nanoseconds / 1e6)
  );

  let userJoinedAtMillis = null;
  if (sortedDrinks.length > 0) {
    const firstDrink = sortedDrinks[0];
    userJoinedAtMillis =
      firstDrink.drankAt.seconds * 1000 +
      firstDrink.drankAt.nanoseconds / 1e6;
  }

  if (userJoinedAtMillis == null || userJoinedAtMillis > time.toMillis()) {
    return 0;
  }

  drinks.forEach((drink) => {
    if (!drink.drankAt) return;

    const drankAtMillis =
      drink.drankAt.seconds * 1000 + drink.drankAt.nanoseconds / 1e6;

    if (drankAtMillis <= time.toMillis()) {
      const volumeLitres = parseFloat(drink.litres.replace(",", "."));
      const abvPercentage = parseFloat(drink.alcohol.replace(",", "."));

      const alcoholGrams =
        volumeLitres *
        GRAMS_PER_LITRE *
        ((abvPercentage * ALCOHOL_DENSITY) / 100);

      totalAlcoholGrams += alcoholGrams;
    }
  });

  const elapsedMillis = time.toMillis() - userJoinedAtMillis;
  const elapsedHours = elapsedMillis / (1000 * 60 * 60);

  const weight = parseFloat(user.weight);
  const BAC =
    totalAlcoholGrams / (weight * alcoholRatio) -
    METABOLISM_RATE * elapsedHours;

  return Math.max(BAC, 0);
};

export const getBACDataPoints = (
  user,
  drinks,
  intervalStart,
  intervalEnd,
) => {

  if (drinks.length === 0 || user == null || drinks == null || intervalStart == null || intervalEnd == null) {
    return new Map();
  }

  const timeDifferenceMillis =
    intervalEnd.toMillis() - intervalStart.toMillis();

  const totalMinutes = timeDifferenceMillis / (60 * 1000);
  const flexibleIntervalMinutes = totalMinutes / DESIRED_NUMBER_POINTS;
  const flexibleIntervalMillis = flexibleIntervalMinutes * 60 * 1000;

  const dataPointsMap = new Map();
  while (intervalStart.toMillis() <= intervalEnd.toMillis()) {
    const date = new Date(intervalStart.toMillis());
    const bac = calculateBAC(user, drinks, intervalStart);
    dataPointsMap.set(date, bac);

    intervalStart = Timestamp.fromMillis(
      intervalStart.toMillis() + flexibleIntervalMillis
    );
  }

  return dataPointsMap;
};

export const getCustomBACDataPoints = (user, drinks) => {
  if (!user || !drinks || drinks.length === 0) {
    return new Map();
  }
  
  const firstDrink = drinks[0];
  const lastDrink = drinks[drinks.length - 1];

  if (firstDrink && lastDrink) {
    const intervalStart = firstDrink.drankAt;
    const intervalEnd = lastDrink.drankAt;

    return getBACDataPoints(user, drinks, intervalStart, intervalEnd);
  } else {
    return new Map();
  }
};


export const calculateTotalAlcoholGrams = (drinks, time) => {
  if (drinks.length === 0 || drinks == null || time == null) {
    return 0;
  }

  let totalAlcoholGrams = 0;
  drinks.forEach((drink) => {
    if (!drink.drankAt) return;
    const drankAtMillis = drink.drankAt.toMillis();
    if (drankAtMillis <= time.toMillis()) {
      const volumeLitres = parseFloat(drink.litres.replace(",", "."));
      const abvPercentage = parseFloat(drink.alcohol.replace(",", "."));

      const alcoholGrams =
        volumeLitres *
        GRAMS_PER_LITRE *
        ((abvPercentage * ALCOHOL_DENSITY) / 100);

      totalAlcoholGrams += alcoholGrams;
    }
  });

  return totalAlcoholGrams
}

export const getTotalAlcoholGramsPoints = (drinks,
  intervalStart,
  intervalEnd) => {
  if (drinks.length === 0 || drinks == null || intervalStart == null || intervalEnd == null) {
    return new Map();
  }

  const timeDifferenceMillis =
    intervalEnd.toMillis() - intervalStart.toMillis();

  const totalMinutes = timeDifferenceMillis / (60 * 1000);
  const flexibleIntervalMinutes = totalMinutes / DESIRED_NUMBER_POINTS;
  const flexibleIntervalMillis = flexibleIntervalMinutes * 60 * 1000;

  const dataPointsMap = new Map();
  while (intervalStart.toMillis() <= intervalEnd.toMillis()) {
    const date = new Date(intervalStart.toMillis());
    const totalAlcoholGrams = calculateTotalAlcoholGrams(drinks, intervalStart);
    dataPointsMap.set(date, totalAlcoholGrams);

    intervalStart = Timestamp.fromMillis(
      intervalStart.toMillis() + flexibleIntervalMillis
    );
  }
  return dataPointsMap;

}

export const isUserBACTrending = (user, drinks, time) => {
  if (user == null || drinks == null || drinks.length == 0 || time == null) {
    return false;
  }

  let userJoinedAtMillis = null;
  if (drinks.length > 0) {
    const firstDrink = drinks[0];
    userJoinedAtMillis =
      firstDrink.drankAt.seconds * 1000 + firstDrink.drankAt.nanoseconds / 1e6;
  }

  const dataPointsMap = getBACDataPoints(
    user,
    drinks,
    Timestamp.fromMillis(userJoinedAtMillis),
    time
  );

  const BACValues = Array.from(dataPointsMap.values());
  const BACTrending = analyzeTrend(BACValues);

  return BACTrending;
};

export const isSessionBACTrending = (averageBACValues) => {
  const BACValues = averageBACValues.map((item) => item.average);
  const BACTrending = analyzeTrend(BACValues);
  return BACTrending;
};


export const calculateDrinkCounts = (userDrinks) => {
  if (userDrinks == null || userDrinks.length === 0) {
    return { "beer": 0, "wine": 0, "booze": 0, "drink": 0 };
  }

  const flattenedDrinks = userDrinks.flat();
  const drinkTypeGrams = INITIAL_DRINKS.reduce((acc, drink) => {
    const volumeLitres = parseFloat(drink.litres.replace(",", "."));
    const abvPercentage = parseFloat(drink.ABV.replace(",", "."));

    const alcoholGrams =
      volumeLitres * GRAMS_PER_LITRE * ((abvPercentage * ALCOHOL_DENSITY) / 100);

    acc[drink.type] = alcoholGrams;
    return acc;
  }, {});

  const drinkCounts = INITIAL_DRINKS.reduce((acc, { type }) => {
    acc[type] = 0;
    return acc;
  }, {});

  flattenedDrinks.forEach((drink) => {
    if (drink == null || drink["type"] == null) return;

    const volumeLitres = parseFloat(drink.litres.replace(",", "."));
    const abvPercentage = parseFloat(drink.alcohol.replace(",", "."));

    const alcoholGrams =
      volumeLitres * GRAMS_PER_LITRE * ((abvPercentage * ALCOHOL_DENSITY) / 100);

    if (drink.type in drinkTypeGrams) {
      drinkCounts[drink.type] += alcoholGrams / drinkTypeGrams[drink.type];
    }
  });

  return drinkCounts;
};

export const analyzeTrend = (bacValues) => {
  if (bacValues.length < 2) {
    return false;
  }
  const slope = calculateSlope(bacValues);
  return slope > 0;
};

export const calculateSlope = (values) => {
  const n = values.length;
  const sumX = values.reduce((acc, _, i) => acc + i, 0);
  const sumY = values.reduce((acc, val) => acc + val, 0);
  const sumXY = values.reduce((acc, val, i) => acc + i * val, 0);
  const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;

  return denominator === 0 ? 0 : numerator / denominator;
};






import { Timestamp } from "firebase/firestore";

const MALE_RATIO = 0.7;
const FEMALE_RATIO = 0.6;
const GRAMS_PER_LITRE = 1000;
const ALCOHOL_DENSITY = 0.789;
const METABOLISM_RATE = 0.15;

const DESIRED_NUMBER_POINTS = 20;

export const calculateBAC = (user, drinks, time) => {
  if (drinks.length === 0) {
    return 0;
  }
  const alcoholRatio = user.gender === "male" ? MALE_RATIO : FEMALE_RATIO;

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

  const joinedAtMillis = user.joinedAt.toMillis();
  const elapsedMillis = time.toMillis() - joinedAtMillis;
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


export const isBACTrending = (user, drinks, time) => {
  const dataPointsMap = getBACDataPoints(
    user,
    drinks,
    user.joinedAt,
    time
  );

  const BACValues = Array.from(dataPointsMap.values());
  const BACTrending = analyzeTrend(BACValues);

  return BACTrending;
};

const analyzeTrend = (bacValues) => {
  if (bacValues.length < 2) {
    return false;
  }
  const slope = calculateSlope(bacValues);
  return slope > 0;
};

const calculateSlope = (values) => {
  const n = values.length;
  const sumX = values.reduce((acc, _, i) => acc + i, 0);
  const sumY = values.reduce((acc, val) => acc + val, 0);
  const sumXY = values.reduce((acc, val, i) => acc + i * val, 0);
  const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumX2 - sumX * sumX;

  return denominator === 0 ? 0 : numerator / denominator;
};

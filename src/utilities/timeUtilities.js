export const formatTime = (timestamp) => {
  const date = timestamp.toDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000);
  const day = date.toLocaleDateString();
  const time = date.toLocaleTimeString();
  return { day, time };
};

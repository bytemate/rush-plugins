export const durationToString = (duration: number): string => {
  if (duration > 60) {
    const minutes: number = Math.floor(duration / 60);
    const seconds: number = duration % 60.0;

    return `${minutes.toFixed(0)} minute${
      minutes === 1 ? "" : "s"
    } ${seconds.toFixed(1)} seconds`;
  } else {
    return `${duration.toFixed(2)} seconds`;
  }
};

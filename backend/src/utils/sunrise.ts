export type SunTimes = {
  sunrise: string | null;
  sunset: string | null;
  solar_noon: string | null;
  day_length: string | null;
};

export const getSunTimes = (
  _lat: number,
  _lon: number,
  _dateISO: string
): SunTimes => ({
  sunrise: null,
  sunset: null,
  solar_noon: null,
  day_length: null,
});

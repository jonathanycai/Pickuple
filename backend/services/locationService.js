import { withOracleDB } from "../appService.js";

export async function fetchCourtsFromDb() {
  return await withOracleDB(async (connection) => {
      const result = await connection.execute('SELECT courtNumber, address, postalCode FROM Court');
      return result.rows;
  }).catch(() => {
      return [];
  });
}

export async function getAddresses() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`SELECT DISTINCT address FROM Location`);
    const addresses = result.rows.map((address) => address[0]);
    return addresses;
  }).catch(() => {
      return [];
  });
}

export async function getPostalCodes() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`SELECT DISTINCT postalCode FROM Location`);
    const postalCodes = result.rows.map((pCode) => pCode[0]);
    return postalCodes;
  }).catch(() => {
      return [];
  });
}

export async function getCityLocations() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT DISTINCT city FROM CityLocation');
    const cities = result.rows.map((city) => city[0]);
    return cities;
  }).catch(() => {
    return [];
  });
}

export async function getProvinceLocations() {
  return await withOracleDB(async (connection) => {
      const result = await connection.execute('SELECT DISTINCT province FROM ProvinceLocation');
      const provinces = result.rows.map((province) => province[0]);
      return provinces;
  }).catch(() => {
      return [];
  });
}
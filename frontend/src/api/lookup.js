import { api } from "./api";


export const getLookup = (table) => {
  return api.get(`/lookup/${table}`);
};
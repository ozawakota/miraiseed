export type DatabaseInfo = {
  name: string;
  stores: string[];
};

export type StoreContent = {
  [key: string]: string | number | boolean | unknown[];
};
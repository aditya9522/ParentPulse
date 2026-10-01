import Constants, { ExecutionEnvironment } from "expo-constants";

export const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants.executionEnvironment as string) === "storeClient" ||
  Constants.expoGoConfig != null;

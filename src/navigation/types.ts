export type RootStackParamList = {
  Home: undefined;
  About: undefined;
  Settings: undefined;
  Vehicles: undefined;
  VehicleForm: { vehicleId?: string };
  TripCalculator: undefined;
  FuelComparison: undefined;
  Consumption: undefined;
  RefuelingForm: { refuelingId?: string } | undefined;
  RefuelingHistory: undefined;
  Statistics: undefined;
  TripHistory: undefined;
  ComparisonHistory: undefined;
  TripMode: undefined;
  StationsMap: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

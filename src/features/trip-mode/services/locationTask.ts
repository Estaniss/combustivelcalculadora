import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { handleLocationBatch } from './tripSession';
import { LocationFix } from './tripTracker';

/**
 * Rastreio de GPS da viagem, com a tela bloqueada.
 *
 * Funciona como um SERVIÇO EM PRIMEIRO PLANO (foreground service do tipo
 * "location") com notificação fixa, iniciado pelo usuário com o app visível.
 * Nesse modo o Android NÃO exige a permissão ACCESS_BACKGROUND_LOCATION — só a
 * de localização "enquanto o app está em uso". (Conferido no código do
 * expo-location: o caminho com foregroundService dispensa a permissão de
 * segundo plano, mas só pode ser iniciado com o app em primeiro plano.)
 *
 * Este módulo precisa ser importado na raiz do app (App.tsx): o defineTask
 * tem que rodar em escopo de módulo para a tarefa existir quando o serviço
 * entregar leituras.
 */
export const TRIP_LOCATION_TASK = 'combustivel-trip-location';

type TaskData = { locations?: Location.LocationObject[] };

export function toFix(location: Location.LocationObject): LocationFix {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

TaskManager.defineTask<TaskData>(TRIP_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  await handleLocationBatch(data.locations.map(toFix));
});

export type LocationPermissionResult = 'granted' | 'denied' | 'blocked';

/** Pede localização "em uso". 'blocked' = o usuário marcou "não perguntar de novo". */
export async function ensureLocationPermission(): Promise<LocationPermissionResult> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return 'granted';

  const result = current.canAskAgain ? await Location.requestForegroundPermissionsAsync() : current;
  if (result.granted) return 'granted';
  return result.canAskAgain ? 'denied' : 'blocked';
}

export function isTripTrackingActive(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK);
}

/** Inicia o serviço. Chame com o app visível (regra do Android 12+). */
export async function startTripTracking(): Promise<void> {
  if (await isTripTrackingActive()) return;
  await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 4000,
    distanceInterval: 5,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Modo Viagem ativo',
      notificationBody: 'Medindo a distância da viagem. Toque para voltar ao app.',
      notificationColor: '#1A4A6F',
      killServiceOnDestroy: false,
    },
  });
}

export async function stopTripTracking(): Promise<void> {
  if (await isTripTrackingActive()) {
    await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK);
  }
}

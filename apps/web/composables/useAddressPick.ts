export type PickedAddress = {
  id: number;
  province: string;
  city: string;
  district: string;
  name?: string;
  phone?: string;
  detail?: string;
  isDefault?: boolean;
};

const STORAGE_KEY = 'sm_picked_address';

export function savePickedAddress(addr: PickedAddress) {
  if (!import.meta.client) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(addr));
}

export function loadPickedAddress(): PickedAddress | null {
  if (!import.meta.client) return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PickedAddress;
  } catch {
    return null;
  }
}

export function clearPickedAddress() {
  if (!import.meta.client) return;
  sessionStorage.removeItem(STORAGE_KEY);
}

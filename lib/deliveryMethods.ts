export type DeliveryMethod = {
  id: string;
  label: string;
  description: string;
  minSeconds: number;
  maxSeconds: number;
};

export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: "smoke_signal",
    label: "Smoke Signal",
    description: "~30 seconds",
    minSeconds: 30,
    maxSeconds: 30,
  },
  {
    id: "helicopter",
    label: "Helicopter",
    description: "~2 minutes",
    minSeconds: 120,
    maxSeconds: 120,
  },
  {
    id: "carrier_pigeon",
    label: "Carrier Pigeon",
    description: "~15 minutes",
    minSeconds: 900,
    maxSeconds: 900,
  },
  {
    id: "donkey",
    label: "Donkey",
    description: "30-60 minutes",
    minSeconds: 1800,
    maxSeconds: 3600,
  },
  {
    id: "snail",
    label: "Snail",
    description: "2-4 hours",
    minSeconds: 7200,
    maxSeconds: 14400,
  },
  {
    id: "kitty_cat",
    label: "Kitty Cat",
    description: "10 minutes - 6 hours (mysterious feline schedule)",
    minSeconds: 600,
    maxSeconds: 21600,
  },
];

export function getDeliveryMethod(id: string): DeliveryMethod | undefined {
  return DELIVERY_METHODS.find((m) => m.id === id);
}

export function rollDurationSeconds(method: DeliveryMethod): number {
  if (method.minSeconds === method.maxSeconds) return method.minSeconds;
  return (
    Math.floor(Math.random() * (method.maxSeconds - method.minSeconds + 1)) +
    method.minSeconds
  );
}

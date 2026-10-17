export const SHIPPING_METHOD_IDS = ['standard', 'express'] as const;

export type ShippingMethodId = (typeof SHIPPING_METHOD_IDS)[number];

export interface ShippingMethodConfig {
  label: string;
  eta: string;
  price: number;
  enabled: boolean;
  /** Can this method be free (seller ships free, or the order is over the free-shipping threshold)? */
  freeEligible: boolean;
}

export interface ShippingSettings {
  methods: Record<ShippingMethodId, ShippingMethodConfig>;
  /** Orders with an item total at or above this ship free on eligible methods. `null` = off. */
  freeShippingOver: number | null;
}

/** Used until an admin saves their own prices in Admin → Settings → Shipping. */
export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  methods: {
    standard: {
      label: 'Standard',
      eta: '3–5 business days',
      price: 5.99,
      enabled: true,
      freeEligible: true,
    },
    express: {
      label: 'Express',
      eta: '1–2 business days',
      price: 14.99,
      enabled: true,
      freeEligible: false,
    },
  },
  freeShippingOver: null,
};

export const SHIPPING_SETTING_KEY = 'shipping_settings';

/** Pending orders older than this are cancelled and their listing released. */
export const PENDING_ORDER_TTL_MINUTES = 30;

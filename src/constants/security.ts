import type { KeywordDictionary } from '../types/security.types.js';

export const DESTRUCTIVE_KEYWORDS: Record<string, KeywordDictionary> = {
  financial: {
    en: [
      'buy',
      'purchase',
      'pay',
      'checkout',
      'order',
      'payment',
      'billing',
      'card',
      'subscribe',
      'donate',
    ],
    ru: ['купить', 'оплатить', 'платить', 'оформить', 'заказ', 'платеж', 'подписка', 'донат'],
    es: ['comprar', 'pagar', 'pedido', 'pago'],
    de: ['kaufen', 'bezahlen', 'bestellen', 'zahlung'],
    fr: ['acheter', 'payer', 'commande', 'paiement'],
  },
  data_loss: {
    en: [
      'delete',
      'remove',
      'clear',
      'erase',
      'cancel',
      'unsubscribe',
      'deactivate',
      'close account',
    ],
    ru: ['удалить', 'очистить', 'стереть', 'отменить', 'отписаться', 'деактивировать', 'закрыть'],
    es: ['eliminar', 'borrar', 'cancelar'],
    de: ['löschen', 'entfernen', 'abbrechen'],
    fr: ['supprimer', 'effacer', 'annuler'],
  },
  content_modification: {
    en: ['send', 'post', 'publish', 'submit', 'upload', 'share', 'create', 'edit'],
    ru: [
      'отправить',
      'опубликовать',
      'разместить',
      'загрузить',
      'поделиться',
      'создать',
      'редактировать',
    ],
    es: ['enviar', 'publicar', 'compartir'],
    de: ['senden', 'veröffentlichen', 'teilen'],
    fr: ['envoyer', 'publier', 'partager'],
  },
  account: {
    en: ['logout', 'log out', 'sign out', 'change password', 'reset', 'verify'],
    ru: ['выйти', 'выход', 'сменить пароль', 'сбросить'],
    es: ['cerrar sesión', 'salir'],
    de: ['abmelden', 'ausloggen'],
    fr: ['déconnexion', 'se déconnecter'],
  },
} as const;

export const SENSITIVE_URL_PATTERNS = [
  /checkout/i,
  /payment/i,
  /cart/i,
  /order/i,
  /billing/i,
  /delete/i,
  /remove/i,
  /settings/i,
  /account/i,
  /profile/i,
] as const;

export const SENSITIVE_FORM_INDICATORS = [
  'payment',
  'credit-card',
  'cvv',
  'card-number',
  'billing',
  'password',
] as const;

export const RISK_LEVEL_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

export const RISK_EMOJI = {
  critical: '🚨',
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️',
} as const;

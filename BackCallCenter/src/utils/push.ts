import webpush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BItTRkPfK1iDK4euoHPiWld36hBtPaS8DEAAcF4adqq2iEGwiPskIwY2QnWKYRXOHdvwr4A-F_Vmt0NfxLnQk0E';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'Dy-_uTvQYPhql7lpbsrnlvdvJD6vkISD9LLDEMuKnT4';
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@gamc.gob.bo';

webpush.setVapidDetails(
  vapidMailto,
  vapidPublicKey,
  vapidPrivateKey
);

export { webpush, vapidPublicKey };

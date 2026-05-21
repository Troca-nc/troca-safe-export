import { Alert, Clipboard, Linking, Platform, Share } from 'react-native';

export type MobileShareContent = {
  kind: 'annonce' | 'profil' | 'content';
  title: string;
  description?: string;
  url: string;
  itemId?: string | number;
};

function normalizeShareUrl(url: string) {
  try {
    const parsed = new URL(url, 'https://troca.nc');
    return parsed.toString();
  } catch {
    return 'https://troca.nc';
  }
}

export function buildMobileShareMessage(content: MobileShareContent) {
  const description = content.description?.trim();
  const url = normalizeShareUrl(content.url);
  return description ? `${content.title}\n\n${description}\n\n${url}` : `${content.title}\n\n${url}`;
}

export function buildMobileShareLinks(content: MobileShareContent) {
  const url = encodeURIComponent(normalizeShareUrl(content.url));
  const text = encodeURIComponent(content.title);
  const message = encodeURIComponent(buildMobileShareMessage(content));

  return {
    url: normalizeShareUrl(content.url),
    whatsapp: `https://wa.me/?text=${message}`,
    messenger: `https://www.messenger.com/share?link=${url}`,
    messengerApp: `fb-messenger://share/?link=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    email: `mailto:?subject=${text}&body=${message}`,
    sms: `sms:?body=${message}`,
  };
}

export async function shareNatively(content: MobileShareContent) {
  await Share.share({
    title: content.title,
    message: buildMobileShareMessage(content),
    url: normalizeShareUrl(content.url),
  });
}

export async function openExternalShare(url: string) {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function shareWithFallback(content: MobileShareContent) {
  try {
    await shareNatively(content);
  } catch {
    if (Platform.OS === 'web') {
      Alert.alert('Partage', 'Le partage natif est indisponible sur ce navigateur.');
    }
  }
}

export async function shareViaAppOrFallback(appUrl: string, fallbackUrl: string, content: MobileShareContent) {
  const opened = await openExternalShare(appUrl);
  if (!opened) {
    const fallbackOpened = await openExternalShare(fallbackUrl);
    if (!fallbackOpened) {
      await shareWithFallback(content);
    }
  }
}

export async function copyShareLink(content: MobileShareContent) {
  Clipboard.setString(normalizeShareUrl(content.url));
  if (Platform.OS !== 'web') {
    Alert.alert('Lien copiÃ©', 'Le lien de partage a Ã©tÃ© copiÃ© dans le presse-papiers.');
  }
}

export async function copyShareMessage(content: MobileShareContent) {
  Clipboard.setString(buildMobileShareMessage(content));
  if (Platform.OS !== 'web') {
    Alert.alert('Texte copié', 'Le texte de partage a été copié dans le presse-papiers.');
  }
}

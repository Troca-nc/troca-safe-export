import { api } from '@/lib/api';

export type PublishListingInput = {
  titre: string;
  description: string;
  price?: string;
  category_id: number;
  commune_id: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';
  contre_quoi?: string;
};

async function uploadListingPhoto(uri: string) {
  const form = new FormData();
  form.append('file', {
    uri,
    name: `photo_${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as any);

  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.url as string;
}

export async function publishListing(data: PublishListingInput, photos: string[]) {
  const uploadedUrls: string[] = [];

  for (const uri of photos) {
    uploadedUrls.push(await uploadListingPhoto(uri));
  }

  await api.post('/listings', {
    title: data.titre,
    titre: data.titre,
    description: data.description,
    price: data.price ? Number(data.price) : null,
    is_free: !data.price,
    category_id: data.category_id,
    commune_id: data.commune_id,
    condition: data.condition,
    contre_quoi: data.contre_quoi || null,
    images: uploadedUrls,
  });
}

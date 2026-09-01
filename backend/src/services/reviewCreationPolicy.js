'use strict';

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function evaluateReviewCreation({ reviewerId, proId, hasInvite = false, hasConversation = false } = {}) {
  const reviewer = toPositiveInteger(reviewerId);
  const professional = toPositiveInteger(proId);

  if (!reviewer) {
    return { allowed: false, status: 401, error: 'Authentification requise pour laisser un avis.' };
  }
  if (!professional) {
    return { allowed: false, status: 400, error: 'Professionnel invalide.' };
  }
  if (reviewer === professional) {
    return { allowed: false, status: 403, error: 'Vous ne pouvez pas évaluer votre propre profil.' };
  }
  if (!hasInvite && !hasConversation) {
    return { allowed: false, status: 403, error: 'Une invitation valide ou un échange avec ce professionnel est requis.' };
  }

  return { allowed: true, status: 201, verified: true, publicationStatus: 'published' };
}

module.exports = { evaluateReviewCreation };

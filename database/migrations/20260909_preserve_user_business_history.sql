-- Les comptes sont anonymisés par l'application. Les suppressions SQL directes
-- ne doivent jamais effacer les écritures comptables ou les historiques partagés.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_buyer_id_fkey
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE verified_reviews DROP CONSTRAINT IF EXISTS verified_reviews_pro_id_fkey;
ALTER TABLE verified_reviews
  ADD CONSTRAINT verified_reviews_pro_id_fkey
  FOREIGN KEY (pro_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE troc_proposals DROP CONSTRAINT IF EXISTS troc_proposals_proposer_id_fkey;
ALTER TABLE troc_proposals
  ADD CONSTRAINT troc_proposals_proposer_id_fkey
  FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE RESTRICT;

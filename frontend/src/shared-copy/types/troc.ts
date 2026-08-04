// ï¿½ COPIE MANUELLE depuis /shared/types/troc.ts
// Ce fichier doit ï¿½tre copiï¿½ ï¿½ nouveau si l'original est modifiï¿½.
// Ne pas ï¿½diter ce fichier sï¿½parï¿½ment de l'original sans reporter le changement des deux cï¿½tï¿½s.
export type TrocStatus = 'open' | 'negotiating' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'seen' | 'accepted' | 'declined' | 'countered' | 'expired' | 'completed';
export type ComplementDirection = 'none' | 'i_pay' | 'they_pay';
export type TrocBadge = 'first_troc' | 'regular_trader' | 'master_trader' | 'cycle_master';
export type CycleStatus = 'proposed' | 'all_accepted' | 'broken' | 'completed';

export interface TrocUserSummary {
  id: number;
  prenom: string;
  nom: string;
  avatar_url?: string | null;
  troc_badges?: TrocBadge[];
}

export interface TrocCompatibility {
  score: number;
  label: 'Excellent' | 'Bon' | 'Possible' | 'Faible';
  matching_listings: TrocListing[];
  matching_count: number;
}

export interface TrocProposal {
  id: string;
  listing_id: number;
  proposer_id: number;
  proposer?: Pick<TrocUserSummary, 'id' | 'prenom' | 'nom' | 'avatar_url'>;
  offered_listing_ids: number[];
  offered_listings?: TrocListing[];
  offered_description?: string | null;
  offered_photos: string[];
  complement_xpf: number;
  complement_direction: ComplementDirection;
  status: ProposalStatus;
  message?: string | null;
  conversation_id?: number | null;
  counter_proposal?: TrocProposal | null;
  created_at: string;
  expires_at: string;
}

export interface TrocCycle {
  id: string;
  participant_ids: number[];
  participants?: Pick<TrocUserSummary, 'id' | 'prenom' | 'nom' | 'avatar_url'>[];
  listing_ids: number[];
  listings?: TrocListing[];
  status: CycleStatus;
  confirmations: number[];
  detected_at: string;
  expires_at: string;
}

export interface TrocListing {
  id: number;
  title: string;
  description?: string | null;
  photos?: string[];
  category?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  is_troc: true;
  troc_wants: string[];
  troc_accepts_complement_xpf: boolean;
  troc_complement_max_xpf: number;
  troc_status: TrocStatus;
  user: Pick<TrocUserSummary, 'id' | 'prenom' | 'nom' | 'avatar_url' | 'troc_badges'>;
  compatibility?: TrocCompatibility | null;
  created_at: string;
}

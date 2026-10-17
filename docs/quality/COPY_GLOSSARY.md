# Glossaire UI et contenu

| Concept | Terme à employer | À éviter | Source de vérité |
|---|---|---|---|
| Localité d'un utilisateur ou d'une annonce | Commune | Province lorsque la valeur est une commune | API des communes |
| État de l'adresse email | Email vérifié / Email non vérifié | Compte vérifié sans préciser le canal | État `email_verified` |
| État du téléphone | Téléphone vérifié / Téléphone non vérifié | Téléphone vérifié après un code email | État `phone_verified` |
| Action de création | Publier une annonce | Mettre un produit si tous les contenus ne sont pas des produits | Parcours de publication |
| Compte professionnel | Compte Pro | Professionnel / Pro utilisés aléatoirement dans le même écran | Profil utilisateur |

## Catégories

Les noms, l'ordre et la hiérarchie des catégories proviennent du catalogue partagé et de la base de données. Aucun écran ne maintient sa propre liste. Toute modification de taxonomie doit être revue côté produit et testée sur la publication, la recherche et les filtres.

## Messages système

- Nommer explicitement le canal de vérification : email ou SMS.
- Ne jamais annoncer un état vérifié avant la validation du code correspondant.
- Employer une action concrète et une solution dans les erreurs.
- Conserver les accents français et l'encodage UTF-8 dans le web, les emails et les données.

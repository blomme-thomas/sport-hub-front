# Glossaire (domaine)

Les termes techniques Angular sont dans `instructions/00-glossary.instructions.md`.

| Terme              | Définition                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activité           | Donnée issue de Garmin Connect, exposée par l'API. Définition précise : à compléter.                                                                                          |
| Charge             | À compléter.                                                                                                                                                                  |
| Récupération       | À compléter.                                                                                                                                                                  |
| Séance planifiée   | À compléter.                                                                                                                                                                  |
| Séance (volume)    | Dans les statistiques, chaque activité compte pour une séance, dans la période qui contient sa date de début (UTC). Distinct de la séance planifiée.                          |
| Volume             | Mesures d'entraînement d'une période : nombre de séances, durée, distance. Calculé par le back (`GET /api/stats`), jamais recalculé par le front.                             |
| Granularité        | Découpage des statistiques : semaine ISO (lundi au dimanche, UTC) ou mois calendaire. Choisie sur le tableau de bord, Semaine par défaut.                                     |
| Période en cours   | Dernière période de la plage affichée : la semaine ou le mois en cours. Ses chiffres clés, sa variation et sa répartition par type sont affichés.                             |
| Période précédente | Période de même granularité, immédiatement antérieure à la période en cours. Toujours complète.                                                                               |
| Variation          | Écart entre la période en cours et la période précédente : écart absolu et pourcentage, signés. Pourcentage « n/a » si la période précédente vaut zéro. Calculée par le back. |

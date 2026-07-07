# Modèles IA — Diagnostic maladies

Un dossier par culture : `models/<cropKey>/model.json` (+ shards `.bin`) + `models/<cropKey>/labels.json`.

`cropKey` doit correspondre à une clé de `CROPS` dans `app.html` (ex: `manioc`, `mais`, `tomate`...).

`labels.json` = tableau de chaînes, dans le même ordre que les sorties softmax du modèle :
```json
["Sain", "Mosaïque", "Striure brune", "Cochenille", "Bactériose"]
```

Une fois le dossier déposé ici, ouvrir `app.html` et ajouter une ligne dans `AI_MODELS`
(section "IA — DIAGNOSTIC MALADIES") :

```js
const AI_MODELS = {
  manioc: { path: './models/manioc/model.json', labels: './models/manioc/labels.json', inputSize: 224 },
};
```

Voir `docs/IA_SETUP.md` pour obtenir un premier modèle (manioc) via Google Colab en ~10 minutes.

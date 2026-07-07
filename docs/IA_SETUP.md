# IA Diagnostic maladies — obtenir un premier modèle (manioc)

## Pourquoi Colab et pas en local

Convertir un modèle TensorFlow vers TensorFlow.js demande `tensorflow` + `tensorflowjs` (Python).
Sur Windows natif, cette chaîne casse à cause de dépendances qui ne supportent pas Windows
(`uvloop`, requis par `orbax-checkpoint` → `flax` → `tensorflowjs` récents) ou qui exigent un
compilateur pour compiler `scipy` depuis les sources. Google Colab tourne sur Linux et n'a aucun
de ces problèmes : `pip install` fonctionne du premier coup.

## Modèle recommandé : CropNet Cassava Disease (Google, Apache-2.0)

- Modèle officiel Google, entraîné spécifiquement sur maladies du manioc — pertinent pour la RDC.
- TF Hub : `https://tfhub.dev/google/cropnet/classifier/cassava_disease_V1/2`
- Entrée attendue : images 224×224, RGB normalisé dans [0,1] — exactement ce que produit déjà
  `runDiseaseAI()` dans `app.html`.
- Classes (à confirmer avec le fichier de labels embarqué par le modèle, voir script ci-dessous) :
  bactériose (CBB), striure brune (CBSD), acarien vert (CGM), mosaïque (CMD), sain, incertain.

## Procédure (≈10 min dans un notebook Colab vide)

```python
# 1. Dépendances (fonctionne sans friction sur Colab)
!pip install -q tensorflow tensorflow-hub tensorflowjs

import tensorflow as tf
import tensorflow_hub as hub

# 2. Charger le modèle CropNet manioc depuis TF Hub
model_url = "https://tfhub.dev/google/cropnet/classifier/cassava_disease_V1/2"
hub_layer = hub.KerasLayer(model_url, input_shape=(224, 224, 3))
model = tf.keras.Sequential([hub_layer])
model.build([None, 224, 224, 3])

# 3. Exporter en SavedModel
model.export("saved_model_manioc")   # tf.keras.Model.export (TF >= 2.13). Sinon: model.save(..., save_format="tf")

# 4. Convertir en TensorFlow.js (graph model, plus léger pour l'inférence)
!tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model \
    saved_model_manioc tfjs_manioc

# 5. Récupérer les vrais labels du modèle (ordre exact des sorties softmax)
# → Le tutoriel officiel "CropNet: Cassava Disease Detection" charge le dataset via TFDS
#   et affiche les noms de classes dans l'ordre exact utilisé par le modèle. Ouvrir ce
#   tutoriel, exécuter les premières cellules, et copier la liste de classes obtenue
#   dans labels.json (étape 6) — ne pas deviner l'ordre.
#   Lien du tutoriel : https://www.tensorflow.org/hub/tutorials/cropnet_cassava

# 6. Écrire labels.json dans l'ordre confirmé à l'étape 5 — l'exemple ci-dessous est un
#    NOM PROVISOIRE à remplacer par l'ordre réel obtenu à l'étape 5, pas une valeur vérifiée :
import json
labels = ["Classe 0 (à confirmer)", "Classe 1 (à confirmer)", "Classe 2 (à confirmer)",
          "Classe 3 (à confirmer)", "Classe 4 (à confirmer)", "Classe 5 (à confirmer)"]
with open("tfjs_manioc/labels.json", "w") as f:
    json.dump(labels, f, ensure_ascii=False)

# 7. Télécharger le dossier tfjs_manioc/ (model.json + .bin + labels.json)
from google.colab import files
import shutil
shutil.make_archive("tfjs_manioc", "zip", "tfjs_manioc")
files.download("tfjs_manioc.zip")
```

## Intégration dans ArtiAirLink

1. Dézipper `tfjs_manioc.zip` → placer son contenu dans `models/manioc/` (à la racine du projet,
   à côté de `app.html`).
2. Dans `app.html`, section **IA — DIAGNOSTIC MALADIES**, décommenter/ajouter dans `AI_MODELS` :
   ```js
   const AI_MODELS = {
     manioc: { path: './models/manioc/model.json', labels: './models/manioc/labels.json', inputSize: 224 },
   };
   ```
3. Ajouter `models/manioc/*` à la liste `ASSETS` de `service-worker.js` si l'usage hors-ligne
   complet est requis dès le premier lancement (sinon le SW le mettra en cache après le premier
   `fetch` réussi, stratégie network-first déjà en place).
4. Tester : créer une mission "Manioc", activer une source image/caméra, aller sur l'écran
   Analyse, cliquer "Lancer le diagnostic IA".

## Étendre à d'autres cultures

Pas de modèle Google équivalent pour maïs/blé/riz/etc. à ce jour. Deux options :
- **Teachable Machine** (teachablemachine.withgoogle.com) : entraîner un classifieur image en
  glissant-déposant des photos par catégorie, export direct au format TensorFlow.js — aucun code
  Python requis, mais nécessite un jeu de photos labellisées par maladie et par culture.
- **PlantVillage + transfer learning** : notebook Colab avec `tf.keras.applications.MobileNetV3Small`
  + fine-tuning sur le sous-ensemble PlantVillage de la culture visée, puis même étape 4 de
  conversion ci-dessus.

Dans les deux cas, le pipeline d'inférence dans `app.html` (`runDiseaseAI`, `loadAIModel`) n'a pas
besoin de changer — il suffit d'ajouter une entrée dans `AI_MODELS`.

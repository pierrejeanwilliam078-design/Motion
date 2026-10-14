"""
Détourage de la mascotte sur les 5 illustrations (modèle BiRefNet général « lite » via rembg).
Produit mask1.png … mask5.png utilisés par prepare_layers.py.

Usage : python segment_mascot.py <dossier_images (1.webp … 5.webp)> <dossier_sortie>
"""
import os, sys
from PIL import Image
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
session = new_session("birefnet-general-lite")
for i in range(1, 6):
    im = Image.open(os.path.join(src, f"{i}.webp")).convert("RGB")
    remove(im, session=session, only_mask=True).save(os.path.join(out, f"mask{i}.png"))
    print("masque", i)

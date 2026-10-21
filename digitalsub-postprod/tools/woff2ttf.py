"""Convert a WOFF font to TTF/OTF (sfnt) so FreeType/PIL can load it everywhere."""
import sys

from fontTools.ttLib import TTFont

f = TTFont(sys.argv[1])
f.flavor = None
f.save(sys.argv[2])

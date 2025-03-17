import os

banned_words = ['fruit', "apple", "banana"]

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <castshadow/>
  <group>
    <variant frequency="100" name="Base">
      <textures>
        <texture file="gaia/tree_skin.png" name="normTex"/>
        <texture file="gaia/tree_skin.png" name="specTex"/>
      </textures>
    </variant>
  </group>
  <group>
    <variant frequency="1" name="a">
      <textures>
        <texture file="gaia/tree_skin.png" name="baseTex"/>
      </textures>
    </variant>
  </group>
  <group>
    <variant frequency="2" name="1">
      <mesh>gaia/cypress_mediterranean_wild.dae</mesh>
    </variant>

  </group>
  <material>basic_trans_wind_norm_spec.xml</material>
</actor>
"""

def check_banned_words(name):
    for i in banned_words:
        if i in name:
            return(False)

    return(True)


for i in os.scandir("."):
    if i.is_file() and i.name.endswith(".xml"):
        if check_banned_words(i.name) == True:
            #overwrite this xml file
            with open(i.name, "w") as f:
                f.write(content)

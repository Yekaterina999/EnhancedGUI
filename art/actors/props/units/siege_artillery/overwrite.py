import os

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <castshadow/>
  <group>
    <variant name="Type-A">
      <mesh>gaia/bullet.dae</mesh>
      <textures>
        <texture file="props/projectile.png" name="baseTex"/>
        <texture file="default_norm.png" name="normTex"/>
        <texture file="null_black.dds" name="specTex"/>
      </textures>
    </variant>
  </group>
  <material>no_trans_norm_spec.xml</material>
</actor>
"""

for i in os.scandir("."):
    if i.is_file() and i.name.endswith(".xml"):
        with open(i.name, "w") as f:
            f.write(content)

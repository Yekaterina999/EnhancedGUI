import os

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <group>
    <variant>
      <mesh>structural/field_plot.dae</mesh>
      <textures>
        <texture file="skeletal/field.png" name="baseTex"/>
        <texture file="default_norm.png" name="normTex"/>
        <texture file="null_black.dds" name="specTex"/>
      </textures>
    </variant>
  </group>
  <material>basic_trans_norm_spec.xml</material>
</actor>
"""

for i in os.scandir("."):
  if i.is_file() and i.name.endswith(".xml") and "field" in i.name:
    with open(i.name, "w") as f:
      f.write(content)

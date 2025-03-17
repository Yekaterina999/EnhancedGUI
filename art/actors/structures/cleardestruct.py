import os

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <castshadow/>
  <group>
    <variant name="rubble 3x3">
      <mesh>structural/plot.dae</mesh>
      <textures>
        <texture file="gaia/shrub_spikes.png" name="baseTex"/>
        <texture file="gaia/shrub_spikes.png"  name="normTex"/>
        <texture file="gaia/shrub_spikes.png"  name="specTex"/>
      </textures>
    </variant>
  </group>
  <material>no_trans_norm_spec.xml</material>
</actor>
"""


for r in os.scandir("."):
    if r.is_file() and r.name.endswith(".xml") and ("destruct" in r.name):
        #correct file
        with open(r.name, "w") as f:
            f.write(content)

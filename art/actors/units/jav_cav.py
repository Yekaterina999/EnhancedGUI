import os


content = """<?xml version="1.0" encoding="UTF-8"  ?>
<actor version="1">
  <castshadow/>
  <group>
    <variant>
      <mesh>skeletal/horse_tessalian.dae</mesh>
      <props>
        <prop actor="units/ptolemies/camel_archer_e_r.xml" attachpoint="rider"/>
      </props>
      <textures>
        <texture file="skeletal/horse_white.png" name="baseTex"/>
      </textures>

    </variant>
  </group>

  <group>
    <variant file="quadraped/horse/white.xml" name="Horse-Trot"/>
    <variant file="quadraped/base_horse_death.xml"/>
    <variant file="quadraped/base_horse_run.xml"/>
    <variant file="quadraped/base_horse_gather_meat.xml" name="gather_meat"/>
  </group>
  <material>no_trans_parallax_spec.xml</material>
</actor>
"""

for result in os.scandir("."):
    if result.is_dir():
        for f in os.scandir(result.name):
            if f.is_file() and f.name.endswith("_m.xml") and "cavalry_archer" in f.name:
                #correct file
                print(f.name)
                with open(os.path.join(result.name, f.name), "w") as this_xml:
                    this_xml.write(content)

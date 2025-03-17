import os

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <castshadow/>
  <group>
    <variant frequency="1" name="Base">
      <mesh>skeletal/new/m_armor_tunic_long.dae</mesh>
      <props>
        <prop actor="props/units/shields/aspis_kart_b.xml" attachpoint="shield"/>
        <prop actor="props/units/weapons/spear.xml" attachpoint="weapon_R"/>
        <prop actor="props/units/heads/new/head_female_dudette_b.xml" attachpoint="head"/>
      </props>
      <textures>
        <texture file="skeletal/hele/tunic_02_01.png" name="baseTex"/>
      </textures>
    </variant>
  </group>
  <group>
    <variant name="Idle"/>
    <variant file="biped/carry_food.xml"/>
    <variant file="biped/carry_meat.xml"/>
    <variant file="biped/carry_wood.xml"/>
    <variant file="biped/carry_stone.xml"/>
    <variant file="biped/carry_metal.xml"/>
  </group>
  <group>
    <variant frequency="1" name="Idle"/>
    <variant file="biped/gather_tree.xml"/>
    <variant file="biped/gather_grain.xml"/>
    <variant file="biped/gather_fruit.xml"/>
    <variant file="biped/gather_meat.xml"/>
    <variant file="biped/gather_rock.xml"/>
    <variant file="biped/gather_ore.xml"/>
    <variant file="biped/gather_ruins.xml"/>
    <variant file="biped/gather_praise.xml"/>
    <variant file="biped/build.xml"/>
    <variant file="biped/build_farm.xml"/>
  </group>
  <material>player_trans_norm_spec.xml</material>
</actor>
"""

for r1 in os.scandir():
    if r1.is_dir():
        for r2 in os.scandir(r1.name):
            if r2.is_file() and "infantry_spearman" in r2.name:
                #open this file and overwite

                with open(os.path.join(r1.name, r2.name), "w") as f:
                    f.write(content)
                    print(os.path.join(r1.name, r2.name))

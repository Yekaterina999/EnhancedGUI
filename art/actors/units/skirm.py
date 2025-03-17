import os

content = """<?xml version="1.0" encoding="utf-8"?>
<actor version="1">
  <castshadow/>
  <group>
    <variant frequency="1" name="Base">
      <mesh>skeletal/new/m_pants.dae</mesh>
      <props>
        <prop actor="props/units/shields/pelta_spart_basic.xml" attachpoint="shield_arm"/>
        <prop actor="props/units/weapons/jav_loaded.xml" attachpoint="weapon_R"/>
        <prop actor="props/units/weapons/jav_ammo.xml" attachpoint="ammo"/>
      </props>
    </variant>
  </group>
  <group>
    <variant frequency="1" name="tunic_fur_01_01">
      <textures>
        <texture file="skeletal/mace/tunic_boots_01.png" name="baseTex"/>
      </textures>
    </variant>
  </group>
  <group>
    <variant file="biped/base_skirmisher_fast.xml" frequency="1" name="Skirmisher-Shield-Fast"/>
    <variant file="biped/carry_food.xml"/>
    <variant file="biped/carry_meat.xml"/>
    <variant file="biped/carry_wood.xml"/>
    <variant file="biped/carry_stone.xml"/>
    <variant file="biped/carry_metal.xml"/>
    <variant file="biped/approach_tree.xml"/>
    <variant file="biped/approach_grain.xml"/>
    <variant file="biped/approach_fruit.xml"/>
    <variant file="biped/approach_meat.xml"/>
    <variant file="biped/approach_rock.xml"/>
    <variant file="biped/approach_ore.xml"/>
    <variant file="biped/approach_ruins.xml"/>
    <variant file="biped/approach_praise.xml"/>
  </group>
  <group>
    <variant frequency="1" name="Idle"/>
    <variant file="biped/attack_ranged_crossbowman_back.xml"/>
    <variant file="biped/attack_capture.xml"/>
    <variant file="biped/attack_slaughter.xml"/>
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
    <variant file="biped/death_cape_pelt.xml"/>
  </group>
  <group>
    <variant>
      <textures>
        <texture file="default_norm.png" name="normTex"/>
        <texture file="null_black.dds" name="specTex"/>
      </textures>
    </variant>
  </group>
  <material>player_trans_norm_spec.xml</material>
</actor>
"""

for r1 in os.scandir():
    if r1.is_dir():
        for r2 in os.scandir(r1.name):
            if r2.is_file() and "infantry_jav" in r2.name:
                #open this file and overwite

                with open(os.path.join(r1.name, r2.name), "w") as f:
                    f.write(content)
                    print(os.path.join(r1.name, r2.name))

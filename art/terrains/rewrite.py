import os


content = """<?xml version="1.0" encoding="utf-8"?>
<terrain>
	<textures>
		<texture name="baseTex" file="types/black.png"/>
		<texture name="normTex" file="types/black.png"/>
		<texture name="specTex" file="types/black.png"/>
	</textures>
	<material>terrain_norm_spec.xml</material>
</terrain>
"""

#we need to go through every folder and rewrite all xml to this, except for the terrains.xml

#firstly, scan for the folders
folders = []



for i in os.scandir("."):
    if i.is_dir(follow_symlinks=True):
        folders.append(i.name)

foldersCount = len(folders)
filesCount = 0
#go into each folder and edit the files

for folder in folders:
    os.system("rm ./{foldername}/*.xmb".format(foldername=folder))
    for r in os.scandir(folder):
        if r.is_file() and r.name.endswith(".xml") and ("terrains" not in r.name):

            #we do want to edit this file
            with open(os.path.join(folder, r.name), "w") as this_file:
                this_file.write(content)
            filesCount += 1

print(foldersCount)
print(filesCount)


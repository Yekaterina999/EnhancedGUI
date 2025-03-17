import os

for i in os.scandir("."):
    if i.is_dir():
        for j in os.scandir(i.name):
            if j.is_file() and j.name.endswith(".xml") and "barrack" in j.name:
                with open(os.path.join(i.name, j.name), "r") as f:
                    content = f.readlines()

                for l in range(0, len(content)):
                    if "<mesh>" in content[l]:
                        content[l] = "<mesh>structural/barrack.dae</mesh>"


                with open(os.path.join(i.name, j.name), "w") as f:
                    for l in range(0, len(content)):
                        f.write(content[l] + "\n")

                print(j.name)

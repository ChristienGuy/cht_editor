import { useState } from "react";
import { Reorder } from "motion/react";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

type Cheat = {
  description: string;
  code: string;
  enabled: boolean;
};

type ChtFile = {
  cheatsCount: number;
  cheats: Cheat[];
};

function serializeChtFile(chtFile: ChtFile): string {
  return `cheats = ${chtFile.cheatsCount}
${chtFile.cheats
  .map(
    (cheat, index) => `
cheat${index}_desc = "${cheat.description}"
cheat${index}_code = "${cheat.code}"
cheat${index}_enable = ${cheat.enabled}`
  )
  .join("\n")}
`;
}

function parseChtFile(file: File): Promise<ChtFile> {
  // The input file will have a first line that has the count of cheats
  // e.g cheats = 74
  // Then the file will have 74 lines of cheats
  // Each cheat will be grouped by empty lines before and after it
  // e.g
  // cheat0_desc = "..."
  // cheat0_code = "..."
  // cheat0_enable = false
  //
  // cheat1_desc = "..."
  // cheat1_code = "..."
  // cheat1_enable = true
  // ...
  // cheat73_desc = "..."
  // cheat73_code = "..."
  // cheat73_enable = true
  const reader = new FileReader();

  const chtFile: ChtFile = {
    cheatsCount: 0,
    cheats: [],
  };

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const text = reader.result as string;

      const lines = text.split("\n");

      const cheatsCount = parseInt(lines[0].split(" = ")[1]);
      const cheats: Cheat[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        if (line === "") {
          cheats.push({
            description: lines[i + 1].split(" = ")[1].replace(/^"|"$/g, ""),
            code: lines[i + 2].split(" = ")[1].replace(/^"|"$/g, ""),
            enabled: lines[i + 3].split(" = ")[1] === "true",
          });

          i += 3;
        }
      }

      chtFile.cheats = cheats;
      chtFile.cheatsCount = cheatsCount;

      resolve(chtFile);
    };

    reader.readAsText(file);
  });
}

export default function Home() {
  const [chtFile, setChtFile] = useState<ChtFile | null>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const chtFile = await parseChtFile(file);
      setChtFile(chtFile);
    }
  };

  const handleReorder = (newOrder: Cheat[]) => {
    if (!chtFile) return;

    console.log("newOrder", newOrder);

    setChtFile({
      ...chtFile,
      cheats: newOrder,
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1>Home</h1>
      <div>
        <label htmlFor="file">Upload File</label>
        <input type="file" id="file" onChange={handleFileChange} />
      </div>

      {chtFile && (
        <Reorder.Group
          className="flex flex-col gap-4"
          values={chtFile.cheats}
          onReorder={handleReorder}
        >
          {chtFile.cheats.map((cheat) => (
            <Reorder.Item key={cheat.description} value={cheat}>
              <pre>{cheat.description}</pre>
              <pre>{cheat.code}</pre>
              <pre>{cheat.enabled ? "true" : "false"}</pre>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {chtFile && (
        <Button
          variant="default"
          onClick={() => {
            const serializedChtFile = serializeChtFile(chtFile);
            console.log(serializedChtFile);
          }}
        >
          Save
        </Button>
      )}
    </div>
  );
}

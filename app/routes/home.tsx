import { useState } from "react";
import { Reorder, useMotionValue } from "motion/react";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { Outlet } from "react-router";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

type Cheat = {
  id: string;
  description: string;
  code: string;
  enabled: boolean;
};

type ChtFile = {
  name: string;
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

  console.log("file", file);

  const chtFile: ChtFile = {
    name: file.name,
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
            id: crypto.randomUUID(),
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

function CheatItem({
  cheat,
  onCheckedChange,
}: {
  cheat: Cheat;
  onCheckedChange: (enabled: boolean) => void;
}) {
  const y = useMotionValue(0);

  return (
    <Reorder.Item
      tabIndex={0}
      drag
      value={cheat}
      className={cn(
        "flex flex-col bg-white/70 p-3 rounded-xl cursor-grab backdrop-blur-xl"
      )}
      style={{ y }}
      whileDrag={{
        scale: 1.01,
        boxShadow:
          "0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))",
        cursor: "grabbing",
      }}
    >
      <pre>{cheat.description}</pre>
      <pre>{cheat.code}</pre>
      <Label>
        <Checkbox checked={cheat.enabled} onCheckedChange={onCheckedChange} />
      </Label>
    </Reorder.Item>
  );
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

    setChtFile({
      ...chtFile,
      cheats: newOrder,
    });
  };

  const handleCheckedChange = (cheat: Cheat, enabled: boolean) => {
    if (!chtFile) return;

    setChtFile({
      ...chtFile,
      cheats: chtFile.cheats.map((c) =>
        c.description === cheat.description ? { ...c, enabled } : c
      ),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    console.log("keydown", e.key);
  };

  const handleNewCheat = () => {
    setChtFile((prevChtFile) => {
      if (!prevChtFile) return null;

      return {
        ...prevChtFile,
        cheatsCount: prevChtFile.cheatsCount + 1,
        cheats: [
          ...prevChtFile.cheats,
          {
            id: crypto.randomUUID(),
            description: "New cheat",
            code: "test",
            enabled: false,
          },
        ],
      };
    });
  };

  return (
    <div className="p-4 flex flex-col gap-8">
      <h1>Home</h1>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Upload File</Label>
        <Input type="file" id="file" onChange={handleFileChange} />
      </div>

      {chtFile && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
            <div>
              <Reorder.Group
                className="flex flex-col gap-4 border-r border-gray-100 pr-4"
                values={chtFile.cheats}
                onReorder={handleReorder}
                onKeyDown={handleKeyDown}
              >
                {chtFile.cheats.map((cheat, index) => (
                  <CheatItem
                    cheat={cheat}
                    key={cheat.id}
                    onCheckedChange={(enabled) =>
                      handleCheckedChange(cheat, enabled)
                    }
                  />
                ))}
              </Reorder.Group>
              <Button onClick={handleNewCheat}>New cheat</Button>
            </div>
            <code>
              <pre>{serializeChtFile(chtFile)}</pre>
            </code>
          </div>
        </>
      )}
    </div>
  );
}

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
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";

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

function serializeCode(code: string): string {
  // All new lines and spaces should be replaced with +
  // There should be no trailing +
  return code.replace(/ |\n/g, "+").replace(/\+$/, "");
}

function serializeChtFile(chtFile: ChtFile): string {
  return `cheats = ${chtFile.cheatsCount}
${chtFile.cheats
  .map(
    (cheat, index) => `
cheat${index}_desc = "${cheat.description}"
cheat${index}_code = "${serializeCode(cheat.code)}"
cheat${index}_enable = ${cheat.enabled}`
  )
  .join("\n")}`;
}

// There are two types of code:
// 1. Code Breaker codes are in the format:
// XXXXXXXX+XXXX+YYYYYYYY+YYYY etc.
// We need to parse the code and return a string with the code in the format:
// XXXXXXXX XXXX
// YYYYYYYY YYYY
// 2. Action Replay/Game Shark codes are in the format:
// XXXXXXXX+YYYYYYYY etc.
// We need to parse the code and return a string with the code in the format:
// XXXXXXXX
// YYYYYYYY
function parseCode(code: string) {
  const parts = code.split("+");
  let result = "";

  if (parts.length === 1) {
    return code;
  }

  const isCodeBreaker = parts[1].length === 4;
  if (isCodeBreaker) {
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        result += parts[i] + " ";
      } else {
        result += parts[i] + "\n";
      }
    }
  } else {
    for (let i = 0; i < parts.length; i++) {
      result += parts[i] + "\n";
    }
  }

  // Remove trailing new lines
  return result.replace(/\n$/, "");
}

function parseChtFile(file: File): Promise<ChtFile> {
  // The input file will have a first line that has the count of cheats
  // e.g cheats = 74
  // Then the file will have 74 lines of cheats
  // Each cheat will be grouped by empty lines before and after it
  // The file can have a mix of code breaker and action replay/game shark codes
  // The file can have a mix of single line and multi line codes
  // The file can have a mix of enabled and disabled codes
  // The file will not have a trailing new line
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
            code: parseCode(lines[i + 2].split(" = ")[1].replace(/^"|"$/g, "")),
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
  onClick,
  cheat,
  onCheckedChange,
}: {
  cheat: Cheat;
  onCheckedChange: (enabled: boolean) => void;
  onClick: () => void;
}) {
  const y = useMotionValue(0);

  return (
    <Reorder.Item
      tabIndex={0}
      drag
      value={cheat}
      className={cn("bg-white/50 rounded-xl cursor-grab backdrop-blur-lg")}
      style={{ y }}
      whileDrag={{
        scale: 1.01,
        boxShadow:
          "0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))",
        cursor: "grabbing",
      }}
    >
      <button
        className="w-full h-full px-2 py-1 flex items-start justify-between gap-2 text-left"
        onClick={onClick}
      >
        <div className="flex flex-col gap-2">
          <span>{cheat.description}</span>
        </div>
      </button>
    </Reorder.Item>
  );
}
export default function Home() {
  const [selectedCheat, setSelectedCheat] = useState<Cheat | null>(null);
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

  const handleNewCheat = () => {
    const newCheat = {
      id: crypto.randomUUID(),
      description: "New cheat",
      code: "test",
      enabled: false,
    };

    setChtFile((prevChtFile) => {
      if (!prevChtFile) return null;

      return {
        ...prevChtFile,
        cheatsCount: prevChtFile.cheatsCount + 1,
        cheats: [...prevChtFile.cheats, newCheat],
      };
    });

    setSelectedCheat(newCheat);
  };

  const handleDownload = () => {
    if (!chtFile) return;

    const blob = new Blob([serializeChtFile(chtFile)], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = chtFile.name;
    a.click();
  };

  const handleCopyToClipboard = () => {
    if (!chtFile) return;

    navigator.clipboard.writeText(serializeChtFile(chtFile));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 flex flex-col gap-8 h-screen">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Upload File</Label>
        <Input type="file" id="file" onChange={handleFileChange} />
      </div>

      {chtFile && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_1fr] gap-4 overflow-auto">
            <div className="flex flex-col gap-4 overflow-auto">
              <Button onClick={handleNewCheat}>New cheat</Button>
              <ScrollArea className="overflow-auto px-2" type="auto">
                <Reorder.Group
                  className="flex flex-col gap-4"
                  values={chtFile.cheats}
                  onReorder={handleReorder}
                >
                  {chtFile.cheats.map((cheat, index) => (
                    <CheatItem
                      onClick={() => {
                        setSelectedCheat(cheat);
                      }}
                      cheat={cheat}
                      key={cheat.id}
                      onCheckedChange={(enabled) =>
                        handleCheckedChange(cheat, enabled)
                      }
                    />
                  ))}
                </Reorder.Group>
              </ScrollArea>
            </div>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={
                    chtFile.cheats.find(
                      (cheat) => cheat.id === selectedCheat?.id
                    )?.description
                  }
                  onChange={(e) => {
                    setChtFile((chtFile) => {
                      if (!chtFile) return null;

                      return {
                        ...chtFile,
                        cheats: chtFile.cheats.map((cheat) =>
                          cheat.id === selectedCheat?.id
                            ? { ...cheat, description: e.target.value }
                            : cheat
                        ),
                      };
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Code</Label>
                <Textarea
                  id="code"
                  value={
                    chtFile.cheats.find(
                      (cheat) => cheat.id === selectedCheat?.id
                    )?.code
                  }
                  onChange={(e) => {
                    setChtFile((chtFile) => {
                      if (!chtFile) return null;

                      return {
                        ...chtFile,
                        cheats: chtFile.cheats.map((cheat) =>
                          cheat.id === selectedCheat?.id
                            ? { ...cheat, code: e.target.value }
                            : cheat
                        ),
                      };
                    });
                  }}
                />
              </div>
            </form>
            <code className="bg-gray-100 py-4 rounded-xl flex flex-col gap-2 overflow-auto">
              <pre className="text-sm text-gray-700 px-4">{chtFile.name}</pre>
              <ScrollArea className="h-full w-full overflow-auto px-4">
                <pre>{serializeChtFile(chtFile)}</pre>
              </ScrollArea>
            </code>
          </div>
          <div className="flex col-span-2 justify-end gap-2">
            <Button onClick={handleDownload}>Download</Button>
            <Button onClick={handleCopyToClipboard}>Copy to clipboard</Button>
          </div>
        </>
      )}
    </div>
  );
}

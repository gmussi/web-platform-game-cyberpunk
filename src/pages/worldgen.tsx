import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { WorldGraph } from "../types/worldgen";
import { generateWorldGraph } from "../generators/WorldGenerator";
import { convertToWorldData, exportWorldData } from "../generators/WorldGraphToWorldData";

const WorldGraphViewer = dynamic(() => import("../components/WorldGraphViewer"), {
  ssr: false,
});

function parseNumber(value: string | string[] | undefined, fallback: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default function WorldgenPage() {
  const router = useRouter();
  const { seed: qSeed, rooms: qRooms, loops, branches, mode } = router.query;

  const [seed, setSeed] = React.useState<string>(String(qSeed ?? "demo-seed"));
  const [rooms, setRooms] = React.useState<number>(parseNumber(qRooms, 20));
  const [loopsRatio, setLoopsRatio] = React.useState<number>(
    Math.max(0, Math.min(1, Number(Array.isArray(loops) ? loops[0] : loops) || 0.3))
  );
  const [branchFactor, setBranchFactor] = React.useState<number>(
    Number(Array.isArray(branches) ? branches[0] : branches) || 1.2
  );
  const [gatingMode, setGatingMode] = React.useState<"keys" | "abilities" | "mixed">(
    (Array.isArray(mode) ? mode[0] : mode) === "abilities"
      ? "abilities"
      : (Array.isArray(mode) ? mode[0] : mode) === "mixed"
      ? "mixed"
      : "keys"
  );

  const [graph, setGraph] = React.useState<WorldGraph | null>(null);

  const regenerate = React.useCallback(
    (override?: { seed?: string; rooms?: number }) => {
      const nextSeed = override?.seed ?? seed;
      const nextRooms = override?.rooms ?? rooms;
      const g = generateWorldGraph({
        rooms: nextRooms,
        seed: nextSeed,
        loopsRatio,
        branchFactor,
        gating: { mode: gatingMode, gateFrequency: 0.25 },
        style: "metroidvania",
      });
      setGraph(g);
      const params = new URLSearchParams({
        seed: nextSeed,
        rooms: String(nextRooms),
        loops: String(loopsRatio),
        branches: String(branchFactor),
        mode: gatingMode,
      });
      router.replace(`/worldgen?${params.toString()}`, undefined, { shallow: true });
    },
    [seed, rooms, loopsRatio, branchFactor, gatingMode, router]
  );

  React.useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadJson = React.useCallback(() => {
    if (!graph) return;
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldgraph_${graph.seed}_${graph.nodes.length}rooms.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [graph]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Metroidvania World Generator</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Seed
          <input
            style={{ marginLeft: 8 }}
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="seed"
          />
        </label>
        <label>
          Rooms
          <input
            type="number"
            style={{ marginLeft: 8, width: 80 }}
            value={rooms}
            onChange={(e) => setRooms(Math.max(4, parseInt(e.target.value || "0", 10)))}
          />
        </label>
        <label>
          Loops
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            style={{ marginLeft: 8, width: 80 }}
            value={loopsRatio}
            onChange={(e) => setLoopsRatio(Math.max(0, Math.min(1, Number(e.target.value))))}
          />
        </label>
        <label>
          Branches
          <input
            type="number"
            step="0.2"
            style={{ marginLeft: 8, width: 80 }}
            value={branchFactor}
            onChange={(e) => setBranchFactor(Number(e.target.value))}
          />
        </label>
        <label>
          Mode
          <select style={{ marginLeft: 8 }} value={gatingMode} onChange={(e) => setGatingMode(e.target.value as any)}>
            <option value="keys">keys</option>
            <option value="abilities">abilities</option>
            <option value="mixed">mixed</option>
          </select>
        </label>

        <button onClick={() => regenerate()} style={{ padding: "6px 12px" }}>Generate</button>
        <button onClick={downloadJson} style={{ padding: "6px 12px" }} disabled={!graph}>
          Download JSON
        </button>
        <button
          onClick={() => {
            if (!graph) return;
            const world = convertToWorldData(graph, {
              tileSize: 32,
              roomWidthTiles: 128,
              roomHeightTiles: 25,
              author: "WorldGen",
            });
            const blob = new Blob([exportWorldData(world)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `world_${graph.seed}_${graph.nodes.length}rooms.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ padding: "6px 12px" }}
          disabled={!graph}
        >
          Convert to WorldData JSON
        </button>
      </div>

      <div style={{ marginBottom: 8, color: "#374151" }}>
        Seed: <code>{graph?.seed ?? seed}</code> • Rooms: <code>{graph?.nodes.length ?? rooms}</code>
      </div>

      {graph && <WorldGraphViewer graph={graph} />}
    </div>
  );
}



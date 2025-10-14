// Autotile configuration for blob-style 8-way autotiling
// Based on the Tileset.png structure

export interface AutotileRule {
  tileIndex: number; // Index in the 8x8 tileset (0-63)
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
  northeast: boolean | null; // null means "don't care"
  southeast: boolean | null;
  southwest: boolean | null;
  northwest: boolean | null;
}

// Autotile rules mapping - each entry defines which neighbors must be solid
// for a specific tile to be used. Null values for diagonals mean they don't matter
// (they're only relevant when both adjacent cardinals are solid)
export const AUTOTILE_RULES: AutotileRule[] = [
  // Row 1
  // 1,1: S, E, SE, SW?, NE?, NW?
  {
    tileIndex: 0,
    north: false, // not listed = must be empty
    south: true, // listed = must be solid
    east: true, // listed = must be solid
    west: false, // not listed = must be empty
    northeast: null, // ? = don't care
    southeast: true, // listed = must be solid
    southwest: null, // ? = don't care
    northwest: null, // not listed = must be empty
  },
  // 1,2: W, SW, S, SE, E, NW?, NE?
  {
    tileIndex: 1,
    north: false,
    south: true,
    east: true,
    west: true,
    northeast: null,
    southeast: true,
    southwest: true,
    northwest: null,
  },
  // 1,3: W, SW, S, NW?, SE?, NE?
  {
    tileIndex: 2,
    north: false,
    south: true,
    east: false,
    west: true,
    northeast: null,
    southeast: null,
    southwest: true,
    northwest: null,
  },
  // 1,4: S, NE?, NW?, SE?, SW?
  {
    tileIndex: 3,
    north: false,
    south: true,
    east: false,
    west: false,
    northeast: null,
    southeast: null,
    southwest: null,
    northwest: null,
  },
  // 1,5: N, NE, E, S, SW, W, NW
  {
    tileIndex: 4,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: false,
    southwest: true,
    northwest: true,
  },
  // 1,6: NW, N, NE, W, S, SE, E
  {
    tileIndex: 5,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: true,
    southwest: false,
    northwest: true,
  },
  // 1,7: W, SW, S, E, NE?, NW?
  {
    tileIndex: 6,
    north: false,
    south: true,
    east: true,
    west: true,
    northeast: null,
    southeast: false,
    southwest: true,
    northwest: null,
  },
  // 1,8: W, S, SE, E, NE?, NW?
  {
    tileIndex: 7,
    north: false,
    south: true,
    east: true,
    west: true,
    northeast: null,
    southeast: true,
    southwest: false,
    northwest: null,
  },

  // Row 2
  // 2,1: N, NE, E, SE, S, NW?, SW?
  {
    tileIndex: 8,
    north: true,
    south: true,
    east: true,
    west: false,
    northeast: true,
    southeast: true,
    southwest: null,
    northwest: null,
  },
  // 2,2: NW, N, NE, E, W, SW, S, SE
  {
    tileIndex: 9,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: true,
    southwest: true,
    northwest: true,
  },
  // 2,3: N, NW, W, SW, S, NE?, SE?
  {
    tileIndex: 10,
    north: true,
    south: true,
    east: false,
    west: true,
    northeast: null,
    southeast: null,
    southwest: true,
    northwest: true,
  },
  // 2,4: N, S, NE?, NW?, SE?, SW?
  {
    tileIndex: 11,
    north: true,
    south: true,
    east: false,
    west: false,
    northeast: null,
    southeast: null,
    southwest: null,
    northwest: null,
  },
  // 2,5: N, NW, W, SW, S, E, SE
  {
    tileIndex: 12,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: false,
    southeast: true,
    southwest: true,
    northwest: true,
  },
  // 2,6: N, NE, E, W, SW, S, SE
  {
    tileIndex: 13,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: true,
    southwest: true,
    northwest: false,
  },
  // 2,7: N, NW, W, E, SE?, SW?
  {
    tileIndex: 14,
    north: true,
    south: false,
    east: true,
    west: true,
    northeast: false,
    southeast: null,
    southwest: null,
    northwest: true,
  },
  // 2,8: N, E, W, NE, SE?, SW?
  {
    tileIndex: 15,
    north: true,
    south: false,
    east: true,
    west: true,
    northeast: true,
    southeast: null,
    southwest: null,
    northwest: false,
  },

  // Row 3
  // 3,1: N, NE, E, NW?, SE?, SW?
  {
    tileIndex: 16,
    north: true,
    south: false,
    east: true,
    west: false,
    northeast: true,
    southeast: null,
    southwest: null,
    northwest: null,
  },
  // 3,2: N, NE, NW, W, E, SE?, SW?
  {
    tileIndex: 17,
    north: true,
    south: false,
    east: true,
    west: true,
    northeast: true,
    southeast: null,
    southwest: null,
    northwest: true,
  },
  // 3,3: W, NW, N, SW?, NE?, SE?
  {
    tileIndex: 18,
    north: true,
    south: false,
    east: false,
    west: true,
    northeast: null,
    southeast: null,
    southwest: null,
    northwest: true,
  },
  // 3,4: N, NW?, NE?
  {
    tileIndex: 19,
    north: true,
    south: false,
    east: false,
    west: false,
    northeast: null,
    southeast: false,
    southwest: false,
    northwest: null,
  },
  // 3,5: N, S, SE, E
  {
    tileIndex: 20,
    north: true,
    south: true,
    east: true,
    west: false,
    northeast: false,
    southeast: true,
    southwest: false,
    northwest: false,
  },
  // 3,6: N, S, SW, W
  {
    tileIndex: 21,
    north: true,
    south: true,
    east: false,
    west: true,
    northeast: false,
    southeast: false,
    southwest: true,
    northwest: false,
  },
  // 3,7: N, NW, W, SW, S, E
  {
    tileIndex: 22,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: false,
    southeast: false,
    southwest: true,
    northwest: true,
  },
  // 3,8: N, NE, E, SE, S, W
  {
    tileIndex: 23,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: true,
    southwest: false,
    northwest: false,
  },

  // Row 4
  // 4,1: E, NE?, SE?
  {
    tileIndex: 24,
    north: false,
    south: false,
    east: true,
    west: false,
    northeast: null,
    southeast: null,
    southwest: false,
    northwest: false,
  },
  // 4,2: E, W, SW?, NW?, SE?, N§?
  {
    tileIndex: 25,
    north: false,
    south: false,
    east: true,
    west: true,
    northeast: null,
    southeast: null,
    southwest: null,
    northwest: null,
  },
  // 4,3: W, NW?, SW?
  {
    tileIndex: 26,
    north: false,
    south: false,
    east: false,
    west: true,
    northeast: false,
    southeast: false,
    southwest: null, // ? = don't care
    northwest: null, // ? = don't care
  },
  // 4,4: no solid neighbors
  {
    tileIndex: 27,
    north: false,
    south: false,
    east: false,
    west: false,
    northeast: false,
    southeast: false,
    southwest: false,
    northwest: false,
  },
  // 4,5: N, S, SE?, E
  {
    tileIndex: 28,
    north: true,
    south: true,
    east: true,
    west: false,
    northeast: false,
    southeast: null,
    southwest: false,
    northwest: false,
  },
  // 4,6: N, SE?, NE?, S, SW?, W
  {
    tileIndex: 29,
    north: true,
    south: true,
    east: false,
    west: true,
    northeast: null,
    southeast: null,
    southwest: null,
    northwest: false,
  },
  // 4,7: N, E, SE, S, SW, W
  {
    tileIndex: 30,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: false,
    southeast: true,
    southwest: true,
    northwest: false,
  },
  // 4,8: N, E, NE, S, NW, W
  {
    tileIndex: 31,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: true,
    southeast: false,
    southwest: false,
    northwest: true,
  },

  // Row 7
  // 7,1: SW?, S, E, NE?
  {
    tileIndex: 48,
    north: false,
    south: true,
    east: true,
    west: false,
    northeast: null,
    southeast: false,
    southwest: null,
    northwest: false,
  },
  // 7,2: NW?, W, S, SE?
  {
    tileIndex: 49,
    north: false,
    south: true,
    east: false,
    west: true,
    northeast: false,
    southeast: null,
    southwest: false,
    northwest: null,
  },
  // 7,3: NW?, W, S, SE?
  {
    tileIndex: 50,
    north: true,
    south: true,
    east: true,
    west: true,
    northeast: false,
    southeast: false,
    southwest: false,
    northwest: false,
  },

  // Row 8
  // 8,1: NW?, N, E, SE?
  {
    tileIndex: 56,
    north: true,
    south: false,
    east: true,
    west: false,
    northeast: false,
    southeast: null,
    southwest: false,
    northwest: null,
  },
  // 8,2: W, N, NE?, SW?
  {
    tileIndex: 57,
    north: true,
    south: false,
    east: false,
    west: true,
    northeast: null,
    southeast: false,
    southwest: null,
    northwest: false,
  },
];

// Helper function to match a neighbor configuration to the correct tile
export function findMatchingTile(
  north: boolean,
  south: boolean,
  east: boolean,
  west: boolean,
  northeast: boolean,
  southeast: boolean,
  southwest: boolean,
  northwest: boolean
): number {
  // Try to find a matching rule
  for (const rule of AUTOTILE_RULES) {
    // Check cardinal directions (must match exactly)
    if (
      rule.north !== north ||
      rule.south !== south ||
      rule.east !== east ||
      rule.west !== west
    ) {
      continue;
    }

    // Check diagonals
    // If rule value is null, it's a "don't care" - any value matches
    // Otherwise, it must match exactly
    if (rule.northeast !== null && rule.northeast !== northeast) {
      continue;
    }

    if (rule.southeast !== null && rule.southeast !== southeast) {
      continue;
    }

    if (rule.southwest !== null && rule.southwest !== southwest) {
      continue;
    }

    if (rule.northwest !== null && rule.northwest !== northwest) {
      continue;
    }

    // Found a match!
    return rule.tileIndex;
  }

  // Default fallback: isolated tile
  console.warn(
    `No matching autotile rule found for neighbors: N=${north}, S=${south}, E=${east}, W=${west}, NE=${northeast}, SE=${southeast}, SW=${southwest}, NW=${northwest}`
  );
  return 27;
}

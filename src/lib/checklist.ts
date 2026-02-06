import { ChecklistItem } from "@/types/inspection";

export const DEFAULT_CHECKLIST: Omit<ChecklistItem, "status">[] = [
  {
    id: "panel-cover",
    category: "General",
    title: "Panel Cover & Enclosure",
    description: "Verify panel cover is intact, properly secured, and all knockouts are filled.",
    necReference: "NEC 408.38, 312.5(C)",
    howToInspect:
      "Check that the dead front cover is present and securely fastened. Look for missing knockouts, gaps, or openings that expose live parts. Verify no rust or physical damage.",
  },
  {
    id: "panel-labeling",
    category: "General",
    title: "Panel Directory & Labeling",
    description: "Verify circuit directory is present, legible, and accurately identifies all circuits.",
    necReference: "NEC 408.4",
    howToInspect:
      "Open panel and check that each circuit breaker position is labeled. Verify labels match actual circuits. Check that the directory is legible (not faded or handwritten illegibly).",
  },
  {
    id: "working-clearance",
    category: "General",
    title: "Working Clearance",
    description: "Ensure minimum 36 inches of clear working space in front of panel.",
    necReference: "NEC 110.26(A)",
    howToInspect:
      "Measure clearance from panel face. Must be at least 36 inches deep, 30 inches wide, and clear to ceiling or 6.5 feet high. No storage or obstructions.",
  },
  {
    id: "main-breaker",
    category: "Service Equipment",
    title: "Main Disconnect / Breaker",
    description: "Verify main breaker is present, properly rated, and functions correctly.",
    necReference: "NEC 230.70, 230.79",
    howToInspect:
      "Identify the main disconnect. Verify its ampere rating matches the service (typically 100A or 200A residential). Check for signs of overheating or damage. Test operation if possible.",
  },
  {
    id: "service-conductors",
    category: "Service Equipment",
    title: "Service Entrance Conductors",
    description: "Check service entrance conductors for proper sizing and condition.",
    necReference: "NEC 230.42, 310.12",
    howToInspect:
      "Inspect the service entrance conductors feeding the main breaker. Verify gauge is appropriate for the service amperage. Look for damage, overheating discoloration, or improper splices.",
  },
  {
    id: "grounding-electrode",
    category: "Grounding & Bonding",
    title: "Grounding Electrode Conductor",
    description: "Verify grounding electrode conductor is present and properly connected.",
    necReference: "NEC 250.24, 250.64",
    howToInspect:
      "Locate the grounding electrode conductor (GEC). Verify it connects from the grounding bus to the grounding electrode (ground rod, water pipe, or Ufer ground). Check for proper size and secure connections.",
  },
  {
    id: "bonding",
    category: "Grounding & Bonding",
    title: "Main Bonding Jumper",
    description: "Verify neutral-to-ground bond is present at service equipment.",
    necReference: "NEC 250.24(B), 250.28",
    howToInspect:
      "In the main panel, verify the main bonding jumper connects the neutral bus to the equipment grounding bus (or enclosure). This bond should only exist at the service equipment, not sub-panels.",
  },
  {
    id: "neutral-ground-separation",
    category: "Grounding & Bonding",
    title: "Neutral/Ground Separation (Sub-panels)",
    description: "If sub-panel, verify neutrals and grounds are on separate buses.",
    necReference: "NEC 250.24(A)(5), 408.40",
    howToInspect:
      "In sub-panels, neutral and equipment ground conductors must be on separate bus bars. The neutral bus must be isolated (floating) from the enclosure. Check that no bonding screw or strap connects them.",
  },
  {
    id: "breaker-sizing",
    category: "Branch Circuits",
    title: "Breaker Sizing & Wire Gauge",
    description: "Verify breaker ampere ratings match conductor sizes on each circuit.",
    necReference: "NEC 240.4, 210.3, Table 310.16",
    howToInspect:
      "For each circuit: 15A breaker → 14 AWG min, 20A → 12 AWG min, 30A → 10 AWG min. Look for oversized breakers on undersized wire (serious fire hazard). Check AFCI/GFCI requirements for applicable circuits.",
  },
  {
    id: "wire-connections",
    category: "Branch Circuits",
    title: "Wire Connections & Terminations",
    description: "Check all wire connections for proper torque and condition.",
    necReference: "NEC 110.14, 110.3(B)",
    howToInspect:
      "Look for signs of loose connections: discoloration, melting, charring. Check that wires are properly stripped and inserted into terminals. No exposed copper outside terminals. Look for double-tapped breakers (two wires on single-pole breaker not rated for it).",
  },
  {
    id: "afci-protection",
    category: "Branch Circuits",
    title: "AFCI Protection",
    description: "Verify AFCI protection on required circuits (bedrooms, living areas).",
    necReference: "NEC 210.12",
    howToInspect:
      "Check that bedrooms, living rooms, dining rooms, family rooms, libraries, dens, sunrooms, recreation rooms, closets, hallways, laundry areas, and similar rooms have AFCI protection. Can be AFCI breakers or outlet-type.",
  },
  {
    id: "gfci-protection",
    category: "Branch Circuits",
    title: "GFCI Protection",
    description: "Verify GFCI protection on required circuits (kitchen, bath, outdoor, garage).",
    necReference: "NEC 210.8",
    howToInspect:
      "Verify GFCI protection for: bathrooms, kitchens (countertop receptacles), garages, outdoors, crawl spaces, unfinished basements, laundry areas, and within 6 feet of sinks. Can be GFCI breakers or receptacles.",
  },
  {
    id: "conductor-condition",
    category: "Wiring",
    title: "Conductor Condition & Insulation",
    description: "Inspect all visible conductors for damage, deterioration, or improper insulation.",
    necReference: "NEC 310.10, 110.12",
    howToInspect:
      "Look for damaged insulation, nicked conductors, evidence of overheating (discoloration/melting), and improper wire types. Check for aluminum wiring and proper AL-rated connections if present.",
  },
  {
    id: "wire-organization",
    category: "Wiring",
    title: "Wire Organization & Management",
    description: "Check that conductors are neatly organized and properly supported.",
    necReference: "NEC 408.3(A), 300.4",
    howToInspect:
      "Wires should be neatly routed and not blocking access to breakers or connections. Check for proper cable connectors at panel entry points. No loose or dangling wires.",
  },
  {
    id: "overcurrent-devices",
    category: "Protection",
    title: "Overcurrent Device Condition",
    description: "Inspect all breakers for proper operation and physical condition.",
    necReference: "NEC 240.1, 240.6",
    howToInspect:
      "Check each breaker for signs of overheating, tripping, or damage. Verify breakers are the correct type for the panel (manufacturer compatibility). Look for Federal Pacific, Zinsco, or other recalled panel brands.",
  },
  {
    id: "panel-fill",
    category: "Protection",
    title: "Panel Capacity & Fill",
    description: "Verify panel is not overfilled and has appropriate spare capacity.",
    necReference: "NEC 408.36",
    howToInspect:
      "Count the number of breaker spaces used vs. total available. Check that tandem/slim breakers are only used in approved positions. Panel should not exceed its listed number of circuits.",
  },
];

export function createChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((item) => ({
    ...item,
    status: "not_started" as const,
  }));
}

export function getCategories(checklist: ChecklistItem[]): string[] {
  return [...new Set(checklist.map((item) => item.category))];
}

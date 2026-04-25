export const storyTheme = {
  plum: "#3d0d35",
  plumDark: "#24061f",
  paper: "#f6eddc",
  paperSoft: "#fbf4e7",
  navy: "#263b5e",
  navyPressed: "#1d2f4e",
  mint: "#58b874",
  ink: "#21314f",
  inkSoft: "#65718c",
  line: "#eadbc4",
  gold: "#f2b25f",
  amber: "#d67d37",
  blush: "#fff4dd",
  white: "#ffffff",
};

export function getRarityColor(rarity?: string | null): string {
  switch (rarity?.toLowerCase()) {
    case "common":
      return "#8b95a8";
    case "uncommon":
      return "#58b874";
    case "rare":
      return "#5aa5ff";
    case "epic":
      return "#9d73ff";
    case "legendary":
      return "#f2b25f";
    default:
      return "#9ca3af";
  }
}

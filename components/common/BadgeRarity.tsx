import { Badge } from "@/components/ui/badge";
import { Rarity } from "@/types/agent";
import { cn } from "@/lib/utils";

interface BadgeRarityProps {
  rarity: Rarity;
  className?: string;
}

export function BadgeRarity({ rarity, className }: BadgeRarityProps) {
  const getStyles = () => {
    switch (rarity) {
      case "Common":
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
      case "Rare":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "Legendary":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/20";
      case "Mythic":
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-orange-500/50 shadow-lg shadow-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold uppercase text-xs tracking-wider",
        getStyles(),
        className
      )}
    >
      {rarity}
    </Badge>
  );
}

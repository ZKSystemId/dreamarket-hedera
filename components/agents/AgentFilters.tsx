"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterOptions, Rarity } from "@/types/agent";
import { Search, X } from "lucide-react";
import { allSkills } from "@/lib/mockData";

interface AgentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function AgentFilters({ filters, onFiltersChange }: AgentFiltersProps) {
  const [skillInput, setSkillInput] = useState("");

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRarityChange = (value: string) => {
    onFiltersChange({ ...filters, rarity: value as Rarity | "all" });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as "newest" | "reputation" | "traded" | "price-low" | "price-high",
    });
  };

  const addSkill = (skill: string) => {
    if (skill && !filters.skills.includes(skill)) {
      onFiltersChange({ ...filters, skills: [...filters.skills, skill] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    onFiltersChange({
      ...filters,
      skills: filters.skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="glass-panel p-6 rounded-lg space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Souls</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name or tagline..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rarity Filter */}
        <div className="space-y-2">
          <Label htmlFor="rarity">Rarity</Label>
          <Select value={filters.rarity} onValueChange={handleRarityChange}>
            <SelectTrigger id="rarity">
              <SelectValue placeholder="All Rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="Common">Common</SelectItem>
              <SelectItem value="Rare">Rare</SelectItem>
              <SelectItem value="Legendary">Legendary</SelectItem>
              <SelectItem value="Mythic">Mythic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger id="sort">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="reputation">Highest Reputation</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="traded">Most Traded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Skills Filter */}
        <div className="space-y-2">
          <Label htmlFor="skills">Filter by Skills</Label>
          <Select value={skillInput} onValueChange={addSkill}>
            <SelectTrigger id="skills">
              <SelectValue placeholder="Select skills..." />
            </SelectTrigger>
            <SelectContent>
              {allSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Skills */}
      {filters.skills.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Skills</Label>
          <div className="flex flex-wrap gap-2">
            {filters.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20 transition-colors"
                onClick={() => removeSkill(skill)}
              >
                {skill}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

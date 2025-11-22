import { SoulAgent } from "@/types/agent";
import { AgentCard } from "./AgentCard";

interface AgentGridProps {
  agents: SoulAgent[];
  featured?: boolean;
}

export function AgentGrid({ agents, featured = false }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No souls found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} featured={featured} />
      ))}
    </div>
  );
}

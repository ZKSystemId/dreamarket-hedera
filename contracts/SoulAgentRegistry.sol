// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SoulAgentRegistry
 * @dev ERC-8004 Compliant Smart Contract for Verifiable On-Chain AI Agents
 * 
 * This contract implements a registry for AI agents (Souls) on Hedera blockchain,
 * providing verifiable on-chain identity and metadata for each agent.
 * 
 * ERC-8004 Standard: Verifiable On-Chain Agents
 * - Each agent has a unique on-chain identifier
 * - Agent metadata is stored on-chain
 * - Agent ownership is verifiable
 * - Agent interactions are trackable
 */
contract SoulAgentRegistry {
    
    // Agent structure
    struct Agent {
        uint256 tokenId;           // NFT token ID (HTS token:serial)
        address owner;             // Current owner address
        address creator;           // Original creator address
        string name;               // Agent name
        string tagline;            // Agent tagline
        uint8 rarity;              // 0=Common, 1=Rare, 2=Legendary, 3=Mythic
        uint8 level;               // Current level (1-20+)
        uint256 xp;                // Current experience points
        uint256 reputation;        // Reputation score (0-100)
        bool isActive;             // Agent active status
        uint256 createdAt;         // Creation timestamp
        uint256 lastUpdated;       // Last update timestamp
    }
    
    // Mapping from agent ID to Agent struct
    mapping(uint256 => Agent) public agents;
    
    // Mapping from owner to list of agent IDs
    mapping(address => uint256[]) public ownerAgents;
    
    // Mapping from creator to list of agent IDs
    mapping(address => uint256[]) public creatorAgents;
    
    // Total number of registered agents
    uint256 public totalAgents;
    
    // Contract owner (for admin functions)
    address public contractOwner;
    
    // Events
    event AgentRegistered(
        uint256 indexed agentId,
        uint256 indexed tokenId,
        address indexed owner,
        address creator,
        string name,
        uint8 rarity
    );
    
    event AgentUpdated(
        uint256 indexed agentId,
        uint8 level,
        uint256 xp,
        uint256 reputation
    );
    
    event AgentTransferred(
        uint256 indexed agentId,
        address indexed from,
        address indexed to
    );
    
    event AgentDeactivated(
        uint256 indexed agentId
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only contract owner");
        _;
    }
    
    modifier agentExists(uint256 agentId) {
        require(agents[agentId].isActive, "Agent does not exist");
        _;
    }
    
    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }
    
    // Constructor
    constructor() {
        contractOwner = msg.sender;
        totalAgents = 0;
    }
    
    /**
     * @dev Register a new AI agent on-chain
     * @param tokenId The HTS NFT token ID (token:serial)
     * @param name Agent name
     * @param tagline Agent tagline
     * @param rarity Rarity level (0-3)
     * @param creator Original creator address
     */
    function registerAgent(
        uint256 tokenId,
        string memory name,
        string memory tagline,
        uint8 rarity,
        address creator
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(rarity <= 3, "Invalid rarity");
        require(creator != address(0), "Invalid creator");
        
        // Check if agent with this tokenId already exists
        // We'll use tokenId as agentId for simplicity
        require(!agents[tokenId].isActive, "Agent already registered");
        
        // Create new agent
        agents[tokenId] = Agent({
            tokenId: tokenId,
            owner: msg.sender,
            creator: creator,
            name: name,
            tagline: tagline,
            rarity: rarity,
            level: 1,
            xp: 0,
            reputation: 50,
            isActive: true,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        // Update mappings
        ownerAgents[msg.sender].push(tokenId);
        creatorAgents[creator].push(tokenId);
        totalAgents++;
        
        // Emit event
        emit AgentRegistered(
            tokenId,
            tokenId,
            msg.sender,
            creator,
            name,
            rarity
        );
        
        return tokenId;
    }
    
    /**
     * @dev Update agent stats (level, XP, reputation)
     * @param agentId Agent ID (tokenId)
     * @param newLevel New level
     * @param newXP New XP
     * @param newReputation New reputation
     */
    function updateAgentStats(
        uint256 agentId,
        uint8 newLevel,
        uint256 newXP,
        uint256 newReputation
    ) external agentExists(agentId) onlyAgentOwner(agentId) {
        require(newLevel >= 1 && newLevel <= 100, "Invalid level");
        require(newReputation <= 100, "Invalid reputation");
        
        agents[agentId].level = newLevel;
        agents[agentId].xp = newXP;
        agents[agentId].reputation = newReputation;
        agents[agentId].lastUpdated = block.timestamp;
        
        emit AgentUpdated(agentId, newLevel, newXP, newReputation);
    }
    
    /**
     * @dev Transfer agent ownership
     * @param agentId Agent ID
     * @param newOwner New owner address
     */
    function transferAgent(
        uint256 agentId,
        address newOwner
    ) external agentExists(agentId) onlyAgentOwner(agentId) {
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != agents[agentId].owner, "Same owner");
        
        address oldOwner = agents[agentId].owner;
        agents[agentId].owner = newOwner;
        agents[agentId].lastUpdated = block.timestamp;
        
        // Update owner mappings
        _removeFromOwnerList(oldOwner, agentId);
        ownerAgents[newOwner].push(agentId);
        
        emit AgentTransferred(agentId, oldOwner, newOwner);
    }
    
    /**
     * @dev Transfer agent ownership for marketplace (admin function)
     * This allows contract owner to transfer agent ownership without being the current owner
     * Useful for marketplace operations where operator needs to transfer on behalf of users
     * @param agentId Agent ID
     * @param newOwner New owner address
     */
    function transferAgentForMarketplace(
        uint256 agentId,
        address newOwner
    ) external agentExists(agentId) onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != agents[agentId].owner, "Same owner");
        
        address oldOwner = agents[agentId].owner;
        agents[agentId].owner = newOwner;
        agents[agentId].lastUpdated = block.timestamp;
        
        // Update owner mappings
        _removeFromOwnerList(oldOwner, agentId);
        ownerAgents[newOwner].push(agentId);
        
        emit AgentTransferred(agentId, oldOwner, newOwner);
    }
    
    /**
     * @dev Deactivate an agent
     * @param agentId Agent ID
     */
    function deactivateAgent(
        uint256 agentId
    ) external agentExists(agentId) onlyAgentOwner(agentId) {
        agents[agentId].isActive = false;
        agents[agentId].lastUpdated = block.timestamp;
        
        emit AgentDeactivated(agentId);
    }
    
    /**
     * @dev Get agent details
     * @param agentId Agent ID
     * @return Agent struct
     */
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agents[agentId].isActive, "Agent does not exist");
        return agents[agentId];
    }
    
    /**
     * @dev Get all agents owned by an address
     * @param owner Owner address
     * @return Array of agent IDs
     */
    function getOwnerAgents(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }
    
    /**
     * @dev Get all agents created by an address
     * @param creator Creator address
     * @return Array of agent IDs
     */
    function getCreatorAgents(address creator) external view returns (uint256[] memory) {
        return creatorAgents[creator];
    }
    
    /**
     * @dev Check if agent exists and is active
     * @param agentId Agent ID
     * @return bool
     */
    function isAgentActive(uint256 agentId) external view returns (bool) {
        return agents[agentId].isActive;
    }
    
    /**
     * @dev Get agent count
     * @return uint256
     */
    function getTotalAgents() external view returns (uint256) {
        return totalAgents;
    }
    
    // Internal helper function
    function _removeFromOwnerList(address owner, uint256 agentId) internal {
        uint256[] storage agentsList = ownerAgents[owner];
        for (uint256 i = 0; i < agentsList.length; i++) {
            if (agentsList[i] == agentId) {
                agentsList[i] = agentsList[agentsList.length - 1];
                agentsList.pop();
                break;
            }
        }
    }
}


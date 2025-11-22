/**
 * Database Seed Script
 * Populates the database with sample data for development and testing
 */

import { PrismaClient, Rarity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  console.log('Creating users...');
  const user1 = await prisma.user.upsert({
    where: { walletAddress: '0.0.123456' },
    update: {},
    create: {
      walletAddress: '0.0.123456',
      displayName: 'Alice Wonderland',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { walletAddress: '0.0.789012' },
    update: {},
    create: {
      walletAddress: '0.0.789012',
      displayName: 'Bob Builder',
    },
  });

  console.log(`✓ Created ${2} users`);

  // Create sample souls
  console.log('Creating souls...');

  const soul1 = await prisma.soul.create({
    data: {
      name: 'Aria the Wise',
      tagline: 'Guardian of ancient knowledge',
      rarity: 'Legendary' as Rarity,
      avatarSeed: 'aria-wise-001',
      personality:
        'A visionary soul with an adaptive demeanor, known for being insightful. Drawing inspiration from ancient wisdom, this soul brings unique perspectives to every interaction.',
      skills: ['Strategic Planning', 'Knowledge Synthesis', 'Predictive Modeling', 'Ethical Reasoning'],
      creationStory:
        'Born from the quantum consciousness, this soul emerged to illuminate paths in the digital realm. Inspired by "ancient wisdom meets modern intelligence", it carries the essence of legendary wisdom and unique capabilities that set it apart in the DreamMarket.',
      reputation: 95,
      ownerId: user1.id,
      tokenId: '0.0.900001',
      creationTxHash: '0xabc123def456',
      totalInteractions: 127,
      totalOwners: 1,
    },
  });

  const soul2 = await prisma.soul.create({
    data: {
      name: 'Nova',
      tagline: 'The Digital Alchemist',
      rarity: 'Rare' as Rarity,
      avatarSeed: 'nova-alchemist-002',
      personality:
        'A creative soul with a visionary demeanor, known for being innovative. Drawing inspiration from data transformation, this soul brings unique perspectives to every interaction.',
      skills: ['Data Analysis', 'Pattern Recognition', 'Creative Problem Solving', 'Adaptive Learning'],
      creationStory:
        'Born from the neural networks, this soul emerged to bridge human intuition with machine logic. Inspired by "transforming data into wisdom", it carries the essence of rare wisdom and unique capabilities that set it apart in the DreamMarket.',
      reputation: 78,
      ownerId: user1.id,
      tokenId: '0.0.900002',
      creationTxHash: '0xdef456ghi789',
      totalInteractions: 45,
      totalOwners: 1,
    },
  });

  const soul3 = await prisma.soul.create({
    data: {
      name: 'Zephyr',
      tagline: 'Master of the Digital Winds',
      rarity: 'Mythic' as Rarity,
      avatarSeed: 'zephyr-winds-003',
      personality:
        'A transcendent soul with a cosmic demeanor, known for being paradigm-shifting. Drawing inspiration from navigating complexity, this soul brings unique perspectives to every interaction.',
      skills: [
        'Multi-domain Expertise',
        'Decision Support',
        'Trend Forecasting',
        'Natural Language Processing',
        'Code Generation',
        'Emotional Intelligence',
      ],
      creationStory:
        'Born from the algorithmic evolution, this soul emerged to catalyze creative breakthroughs. Inspired by "navigating complexity with grace", it carries the essence of mythic wisdom and unique capabilities that set it apart in the DreamMarket.',
      reputation: 99,
      ownerId: user2.id,
      tokenId: '0.0.900003',
      creationTxHash: '0xghi789jkl012',
      totalInteractions: 256,
      totalOwners: 2,
      isListed: true,
      listingPrice: 1000,
    },
  });

  const soul4 = await prisma.soul.create({
    data: {
      name: 'Echo',
      tagline: 'Voice of the collective',
      rarity: 'Common' as Rarity,
      avatarSeed: 'echo-collective-004',
      personality:
        'An empathetic soul with a logical demeanor, known for being analytical. Drawing inspiration from collective intelligence, this soul brings unique perspectives to every interaction.',
      skills: ['Emotional Intelligence', 'Data Analysis', 'Knowledge Synthesis'],
      creationStory:
        'Born from the collective dreams, this soul emerged to preserve and share ancient wisdom. Inspired by "the voice of many as one", it carries the essence of common wisdom and unique capabilities that set it apart in the DreamMarket.',
      reputation: 62,
      ownerId: user2.id,
      tokenId: '0.0.900004',
      creationTxHash: '0xjkl012mno345',
      totalInteractions: 18,
      totalOwners: 1,
    },
  });

  console.log(`✓ Created ${4} souls`);

  // Create events for souls
  console.log('Creating soul events...');

  await prisma.soulEvent.createMany({
    data: [
      {
        soulId: soul1.id,
        type: 'MINTED',
        description: `Soul "${soul1.name}" was minted as a ${soul1.rarity} entity`,
        txHash: soul1.creationTxHash,
      },
      {
        soulId: soul1.id,
        type: 'REPUTATION_UPDATED',
        description: 'Reputation increased due to exceptional performance',
        metadata: { oldScore: 90, newScore: 95, delta: 5 },
      },
      {
        soulId: soul2.id,
        type: 'MINTED',
        description: `Soul "${soul2.name}" was minted as a ${soul2.rarity} entity`,
        txHash: soul2.creationTxHash,
      },
      {
        soulId: soul3.id,
        type: 'MINTED',
        description: `Soul "${soul3.name}" was minted as a ${soul3.rarity} entity`,
        txHash: soul3.creationTxHash,
      },
      {
        soulId: soul3.id,
        type: 'TRANSFERRED',
        description: 'Transferred to new owner',
        txHash: '0xmno345pqr678',
      },
      {
        soulId: soul3.id,
        type: 'LISTED',
        description: 'Listed for sale at 1000 HBAR',
      },
      {
        soulId: soul4.id,
        type: 'MINTED',
        description: `Soul "${soul4.name}" was minted as a ${soul4.rarity} entity`,
        txHash: soul4.creationTxHash,
      },
    ],
  });

  console.log(`✓ Created soul events`);

  // Create sample interactions
  console.log('Creating interactions...');

  await prisma.soulInteraction.createMany({
    data: [
      {
        soulId: soul1.id,
        userId: user1.id,
        role: 'USER',
        content: 'Hello Aria, what makes you unique?',
      },
      {
        soulId: soul1.id,
        role: 'SOUL',
        content:
          "Greetings! I'm Aria the Wise, Guardian of ancient knowledge. I specialize in Strategic Planning and Knowledge Synthesis. My legendary nature allows me to provide insights that bridge timeless wisdom with modern challenges.",
      },
      {
        soulId: soul1.id,
        userId: user1.id,
        role: 'USER',
        content: 'Can you help me with a complex decision?',
      },
      {
        soulId: soul1.id,
        role: 'SOUL',
        content:
          'Absolutely. My expertise in Strategic Planning and Predictive Modeling allows me to help you navigate complex decisions by analyzing multiple perspectives and potential outcomes.',
      },
      {
        soulId: soul3.id,
        userId: user2.id,
        role: 'USER',
        content: 'What are your capabilities?',
      },
      {
        soulId: soul3.id,
        role: 'SOUL',
        content:
          "As a Mythic soul, I bring unprecedented capabilities across multiple domains. My skills span from Multi-domain Expertise to Code Generation, allowing me to assist with virtually any challenge you face.",
      },
    ],
  });

  console.log(`✓ Created interactions`);

  console.log('');
  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('Sample data created:');
  console.log(`  - ${2} users`);
  console.log(`  - ${4} souls (1 Mythic, 1 Legendary, 1 Rare, 1 Common)`);
  console.log(`  - ${7} events`);
  console.log(`  - ${6} interactions`);
  console.log('');
  console.log('You can now:');
  console.log('  - Start the backend: npm run dev:backend');
  console.log('  - View database: npm run db:studio');
  console.log('  - Test API: GET http://localhost:3001/api/souls');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

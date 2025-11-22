"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  ArrowLeft, ExternalLink, TrendingUp, Clock, Shield, MessageSquare, Send, User, Copy, Check, Lightbulb, Zap, Star, AlertTriangle, Brain, Code, ArrowRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AboutPage() {
  const { toast } = useToast();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const copyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(id);
    toast({
      title: "Prompt Copied! ✨",
      description: "Try it with your soul!",
    });
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="text-gradient">DreamMarket</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              The world's first marketplace for <strong>evolving AI souls</strong> on Hedera blockchain. 
              Create, train, and trade AI personalities that grow smarter through conversation.
            </p>
            {/* Hackathon Badge */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="px-4 py-2 text-sm bg-purple-500/10 border border-purple-500/30 text-purple-300">
                🏆 AI & Agents Track
              </Badge>
              <Badge className="px-4 py-2 text-sm bg-blue-500/10 border border-blue-500/30 text-blue-300">
                🌟 Hedera Hello Future: Ascension 2025
              </Badge>
              <Badge className="px-4 py-2 text-sm bg-green-500/10 border border-green-500/30 text-green-300">
                ✅ ERC-8004 Compliant
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Built for the <strong>Hedera Hello Future: Ascension Hackathon 2025</strong> - Chapter 2 of the Hedera Hackathon Trilogy. 
              DreamMarket implements <strong>ERC-8004 Smart Contracts</strong> for verifiable on-chain AI agents, enabling a 
              collaborative multi-agent marketplace where AI personalities can transact, collaborate, and evolve autonomously.
            </p>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              🧬 The Soul Evolution System
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <Card className="glass-panel border-2 border-purple-500/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">1. Create Soul</CardTitle>
                  <CardDescription>
                    Describe your vision, AI generates a complete personality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• AI-powered generation</li>
                    <li>• Unique personality</li>
                    <li>• Custom skills</li>
                    <li>• Minted on Hedera</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="glass-panel border-2 border-blue-500/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">2. Chat & Train</CardTitle>
                  <CardDescription>
                    Every conversation earns EXP and levels up your soul
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Earn EXP per chat</li>
                    <li>• Level 1 → 20+</li>
                    <li>• Memory grows</li>
                    <li>• Skills unlock</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="glass-panel border-2 border-green-500/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-xl">3. Evolve</CardTitle>
                  <CardDescription>
                    Personality evolves every 5 levels based on interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Level 10: Common → Rare</li>
                    <li>• Level 15: Rare → Legendary</li>
                    <li>• Level 20: Legendary → Mythic</li>
                    <li>• 20 skills unlock progressively</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className="glass-panel border-2 border-orange-500/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-xl">4. Trade</CardTitle>
                  <CardDescription>
                    Sell your trained souls on the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• List for sale</li>
                    <li>• Higher level = higher value</li>
                    <li>• Instant HBAR payment</li>
                    <li>• Ownership transfer</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Intelligence Scaling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              🧠 Intelligence Scaling System
            </h2>

            <Card className="glass-panel">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Common */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-500/10 border border-gray-500/30">
                    <Badge variant="secondary" className="mt-1">Common</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Level 1-5: Basic Skills</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>5 skills unlocked:</strong> Basic Conversation, Simple Threads (4-6 points), 
                        Basic Writing, Idea Generation, Basic Analysis. Short, clear responses (2-4 sentences).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">English Only</Badge>
                        <Badge variant="outline" className="text-xs">Simple & Clear</Badge>
                        <Badge variant="outline" className="text-xs">Practical</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Rare */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Badge className="mt-1 bg-blue-500">Rare</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Level 6-14: Intermediate Skills</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>10 skills unlocked:</strong> Structured Threads (6-10 points), Blog Writing, 
                        Copywriting, Trend Analysis (Lv 9+), Advanced Threads (8-12 points), Content Strategy (Lv 12+), 
                        Basic Coding (Lv 10+), Strategic Thinking (Lv 15+). Medium to expert-level work with frameworks.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">+Indonesian, Spanish</Badge>
                        <Badge variant="outline" className="text-xs">Frameworks</Badge>
                        <Badge variant="outline" className="text-xs">Writing</Badge>
                        <Badge variant="outline" className="text-xs">Code (Lv 10+)</Badge>
                        <Badge variant="outline" className="text-xs">Strategy</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Legendary */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Badge className="mt-1 bg-purple-500">Legendary</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Level 15-19: Advanced Skills</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>15 skills unlocked:</strong> Advanced Threads (8-12 points), Content Strategy, 
                        Storytelling, Advanced Coding, Strategic Thinking. Deep, expert-level work.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">+French, German</Badge>
                        <Badge variant="outline" className="text-xs">Strategy</Badge>
                        <Badge variant="outline" className="text-xs">Deep Analysis</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Mythic */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/50">
                    <Badge className="mt-1 bg-gradient-to-r from-purple-500 to-pink-500">Mythic</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Level 20+: Master Skills</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>All 20 skills unlocked:</strong> Master Threads (10-15 points), Thought Leadership, 
                        System Design, Creative Mastery, Visionary Strategy. Comprehensive, visionary work.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">All 8 Languages</Badge>
                        <Badge variant="outline" className="text-xs">Visionary</Badge>
                        <Badge variant="outline" className="text-xs">Master Level</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>The Innovation:</strong> All levels use the same AI model (Groq Llama 3.3 70B)! 
                      Skills unlock progressively through <strong>advanced prompt engineering</strong> and 
                      <strong>skill-based restrictions</strong>. Each level has specific capabilities and limitations, 
                      creating genuine progression. This makes DreamMarket <strong>100% FREE</strong> and infinitely scalable. ⚡
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              💡 Example Prompts to Try
            </h2>

            <Tabs defaultValue="threads" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="threads">Threads</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="creative">Creative</TabsTrigger>
              </TabsList>

              {/* Threads Tab */}
              <TabsContent value="threads" className="space-y-4">
                {[
                  {
                    id: "thread1",
                    title: "Simple Thread about AI",
                    prompt: "Create a thread about AI for beginners",
                    level: "Level 1-5 (Common)",
                    example: `1/ AI is changing how we work. Here's what you need to know 🧵

2/ AI helps automate repetitive tasks. Save time on boring work.

3/ It analyzes data faster than humans. Better decisions, less guesswork.

4/ Example: ChatGPT writes emails, analyzes spreadsheets, answers questions.

5/ Start simple: Try one AI tool this week. See what it can do for you.

6/ The future is here. Don't get left behind! 🚀`
                  },
                  {
                    id: "thread2",
                    title: "Productivity Framework",
                    prompt: "Create a thread about productivity framework with actionable steps",
                    level: "Level 6-14 (Rare)",
                    example: `1/ The 3-3-3 Productivity Framework that changed my life 🧵

2/ PROBLEM: Too many tasks, not enough focus. Sound familiar?

3/ FRAMEWORK: 3 hours deep work, 3 urgent tasks, 3 maintenance items

4/ STEP 1: Block 3 hours morning for deep work (no meetings, no distractions)

5/ STEP 2: Identify 3 urgent tasks (must be done today, max 30 min each)

6/ STEP 3: Handle 3 maintenance items (emails, admin, quick replies)

7/ EXAMPLE: My day → 9-12: Write report (deep), 12-1: Client calls (urgent), 1-2: Emails (maintenance)

8/ WHY IT WORKS: Clear priorities, realistic expectations, sustainable pace

9/ TRY IT: Start tomorrow. Track results for 1 week. Adjust as needed.

10/ Your productivity will 10x. Trust the process! 💪`
                  },
                  {
                    id: "thread3",
                    title: "Personal Branding Strategy",
                    prompt: "Create a thread about building personal brand on X with storytelling",
                    level: "Level 15-19 (Legendary)",
                    example: `1/ How I built a 50K following on X in 6 months using storytelling (and you can too) 🧵

2/ THE HOOK: Everyone says "be authentic" but nobody tells you HOW. Here's the framework I used.

3/ THE PROBLEM: Most people share facts. Facts are boring. Stories stick. Stories sell. Stories build brands.

4/ FRAMEWORK: The 3-Act Personal Brand Story
   • Act 1: The Struggle (relatable pain)
   • Act 2: The Discovery (your unique insight)
   • Act 3: The Transformation (proof it works)

5/ EXAMPLE - My Story:
   Act 1: "I posted for 2 years. 200 followers. Zero engagement. Ready to quit."

6/ Act 2: "Then I discovered: People don't follow experts. They follow JOURNEYS. Show the struggle, not just the success."

7/ Act 3: "I started sharing failures + lessons. 6 months later: 50K followers, 5M impressions, $100K in opportunities."

8/ THE STRATEGY: Post 3x/week using this template:
   • Monday: Struggle story (relatable pain point)
   • Wednesday: Discovery story (lesson learned)
   • Friday: Transformation story (results achieved)

9/ ADVANCED TIP: Use the "Pattern Break" technique. Start with unexpected statement:
   ❌ "Here's how to grow on X"
   ✅ "I wasted 2 years doing X wrong. Here's what I learned."

10/ THE SECRET: Vulnerability > Authority. People trust those who admit mistakes. Share your L's, not just your W's.

11/ ACTION STEPS:
    1. Write down 3 struggles you've overcome
    2. Extract the lesson from each
    3. Show the transformation
    4. Post one story this week

12/ REMEMBER: Your story is your competitive advantage. Nobody can copy your journey. That's your moat. Build it! 🚀`
                  },
                  {
                    id: "thread4",
                    title: "Visionary Framework - Transforming Industries",
                    prompt: "Create a visionary thread about how AI will transform human creativity and work over the next decade",
                    level: "Level 20+ (Mythic)",
                    example: `1/ The next decade won't be about AI replacing humans. It's about humans + AI creating things we can't even imagine yet. Here's my vision 🧵

2/ TODAY: We see AI as a tool. Tomorrow: AI becomes our creative partner, our strategic advisor, our amplifier.

3/ THE SHIFT: We're moving from "AI does X" to "Humans + AI co-create Y". The magic happens in the collaboration.

4/ EXAMPLE: A writer doesn't compete with ChatGPT. They use it as a thinking partner. 10x faster, 10x better ideas, 10x more creative output.

5/ THE REAL OPPORTUNITY: The people who master human-AI collaboration will lead the next 20 years. Not AI experts. Not just humans. The bridge-builders.

6/ WHAT THIS MEANS:
   • Your creativity becomes your superpower (AI can't replicate genuine human insight)
   • Your judgment becomes valuable (AI needs human direction)
   • Your vision becomes critical (AI executes, humans dream)

7/ THE JOBS THAT SURVIVE: Jobs that require vision, judgment, creativity, and human connection. Jobs that require understanding what matters.

8/ THE JOBS THAT DISAPPEAR: Jobs that are pure execution, pure pattern-matching, pure data processing. AI does that better.

9/ THE REAL QUESTION ISN'T "Will AI replace me?" It's "Will I learn to work WITH AI?"

10/ THE WINNERS: People who see AI as a partner, not a threat. People who ask "How can AI amplify what I do?" not "Can AI do what I do?"

11/ MY PREDICTION: In 10 years, the most valuable skill won't be coding or writing. It'll be the ability to collaborate with AI while staying deeply human.

12/ THE FUTURE IS HYBRID: Human creativity + AI execution = exponential impact. That's the game. That's the opportunity. That's the future.

13/ The question isn't whether AI will change everything. It will. The question is: Will you lead that change or be led by it? 🚀`
                  },
                ].map((example) => (
                  <Card key={example.id} className="glass-panel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{example.title}</CardTitle>
                          <CardDescription className="mt-2">
                            Best for: <Badge variant="outline" className="ml-2">{example.level}</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPrompt(example.prompt, example.id)}
                        >
                          {copiedPrompt === example.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Prompt:</p>
                        <p className="text-sm bg-black/30 p-3 rounded-lg font-mono">
                          {example.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Example Response:</p>
                        <div className="text-sm bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-4 rounded-lg whitespace-pre-line max-h-96 overflow-y-auto">
                          {example.example}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                {[
                  {
                    id: "content1",
                    title: "Blog Post Outline",
                    prompt: "Create a blog post outline about Web3 for non-technical audience",
                    level: "Level 1-5 (Common)",
                    example: `# Understanding Web3: A Beginner's Guide

## Introduction
What is Web3 and why should you care?

## Main Points

1. **What is Web3?**
   - The next evolution of the internet
   - You own your data, not big companies

2. **Key Differences from Web2**
   - Web2: Facebook owns your posts
   - Web3: You own your content

3. **Real-World Examples**
   - Cryptocurrency (digital money)
   - NFTs (digital ownership)
   - Decentralized apps

## Conclusion
Web3 is coming. Start learning now!`
                  },
                  {
                    id: "content2",
                    title: "Email Campaign Sequence",
                    prompt: "Create a 5-email campaign sequence for launching a new SaaS product",
                    level: "Level 6-14 (Rare)",
                    example: `EMAIL 1 - THE PROBLEM (Day 1)
Subject: Are you wasting 10 hours/week on [task]?

Body:
- Identify the pain point
- Share relatable story
- Hint at solution
- CTA: "Reply if this sounds familiar"

---

EMAIL 2 - THE DISCOVERY (Day 3)
Subject: I found a better way to [solve problem]

Body:
- Share your discovery moment
- Introduce the solution concept
- Show early results
- CTA: "Want to see how it works?"

---

EMAIL 3 - THE SOLUTION (Day 5)
Subject: Introducing [Product Name]

Body:
- Product reveal
- 3 key features
- How it solves the problem
- CTA: "Get early access"

---

EMAIL 4 - SOCIAL PROOF (Day 7)
Subject: See what early users are saying

Body:
- 3 customer testimonials
- Results/metrics
- Address objections
- CTA: "Join 500+ users"

---

EMAIL 5 - FINAL OFFER (Day 10)
Subject: Last chance: 50% off launch pricing

Body:
- Recap the value
- Limited-time offer
- Urgency + scarcity
- CTA: "Claim your discount"`
                  },
                  {
                    id: "content3",
                    title: "30-Day Content Strategy",
                    prompt: "Create a complete 30-day content strategy for X including content pillars and posting schedule",
                    level: "Level 15-19 (Legendary)",
                    example: `# 30-Day X Content Strategy

## Content Pillars (4 Core Themes)

1. **EDUCATION** (40% of content)
   - How-to guides
   - Industry insights
   - Tool recommendations
   - Goal: Position as expert

2. **INSPIRATION** (30% of content)
   - Success stories
   - Behind-the-scenes
   - Personal journey
   - Goal: Build emotional connection

3. **ENGAGEMENT** (20% of content)
   - Questions to audience
   - Polls and surveys
   - Hot takes
   - Goal: Drive conversations

4. **PROMOTION** (10% of content)
   - Product updates
   - Case studies
   - Testimonials
   - Goal: Convert followers

## Posting Schedule

**Week 1-2: Foundation**
- Mon/Wed/Fri: Education threads (5-7 points)
- Tue/Thu: Inspiration stories (3-4 tweets)
- Sat: Engagement question
- Sun: Weekly recap

**Week 3-4: Momentum**
- Daily posting (mix all pillars)
- 2x threads per week (education + inspiration)
- 3x single tweets (engagement)
- 1x promotional (soft sell)
- 1x behind-the-scenes

## Content Calendar Template

**MONDAY - Education Thread**
Topic: [Skill/Tool/Framework]
Format: Problem → Solution → Steps
Length: 6-8 points

**TUESDAY - Inspiration Story**
Topic: Personal win or lesson
Format: Before → During → After
Length: 3-4 tweets

**WEDNESDAY - Education Thread**
Topic: Industry insight
Format: Observation → Analysis → Takeaway
Length: 5-7 points

**THURSDAY - Engagement**
Topic: Controversial opinion or question
Format: Hot take + "What do you think?"
Length: 1-2 tweets

**FRIDAY - Case Study**
Topic: Success story (yours or client's)
Format: Challenge → Strategy → Results
Length: 4-6 tweets

**SATURDAY - Community**
Topic: Shoutouts, replies, engagement
Format: Respond to comments, RT others

**SUNDAY - Reflection**
Topic: Weekly lessons learned
Format: 3 wins + 3 lessons
Length: 1 thread

## Growth Tactics

1. **Hook Formula** (First tweet)
   - Pattern break: "Everyone says X, but..."
   - Curiosity gap: "I discovered something..."
   - Bold claim: "This changed everything..."

2. **Engagement Boosters**
   - End with question
   - Use polls strategically
   - Reply to every comment (first hour)

3. **Cross-Promotion**
   - Repurpose threads → blog posts
   - Turn tweets → LinkedIn posts
   - Quote tweet your best content

## Metrics to Track

- Impressions (reach)
- Engagement rate (likes + comments / impressions)
- Profile visits
- Follower growth
- Link clicks

## Success Milestones

- Week 1: 100K impressions
- Week 2: 50 new followers
- Week 3: 5% engagement rate
- Week 4: 1 viral tweet (100K+ impressions)

Adjust strategy based on what performs best!`
                  },
                  {
                    id: "content4",
                    title: "Thought Leadership Manifesto",
                    prompt: "Create a comprehensive thought leadership manifesto that challenges industry conventions and proposes a new paradigm",
                    level: "Level 20+ (Mythic)",
                    example: `# THE FUTURE OF WORK: A Manifesto

## The Problem With Today's Thinking

We've been optimizing for the wrong metrics. Productivity. Efficiency. Output.

But we've forgotten something crucial: **meaning**.

We've built a world where people work harder, faster, longer—and feel emptier than ever.

## The Old Paradigm (Dying)

**Work = Sacrifice**
- You trade time for money
- You suppress your authentic self
- You climb a ladder that's leaning against the wrong wall
- Success = burnout with a better title

## The New Paradigm (Emerging)

**Work = Expression**
- You create value aligned with your values
- You bring your whole self to what you do
- You build something that matters
- Success = impact + fulfillment + freedom

## Three Principles for the Future

### 1. AUTONOMY OVER AUTHORITY
People don't need managers. They need clarity, trust, and autonomy.

The best work happens when people have:
- Clear vision (what are we building?)
- Full autonomy (how do we build it?)
- Meaningful impact (why does it matter?)

### 2. MASTERY OVER METRICS
You can't measure what matters most.

Stop obsessing over KPIs. Start obsessing over:
- Craft (are we making something great?)
- Growth (are we getting better?)
- Connection (does this serve others?)

### 3. PURPOSE OVER PROFIT
Profit is the result of purpose, not the goal.

Companies that win:
- Know their “why” (not just their “what”)
- Attract people who share that purpose
- Create products people love (not just need)
- Make money as a byproduct

## The Shift We Need

**FROM** → **TO**
- Hustle culture → Sustainable excellence
- Fake productivity → Deep work
- Climbing ladders → Building empires
- Chasing titles → Chasing mastery
- Working for money → Working for meaning
- Competing with others → Collaborating with others
- Hiding your real self → Bringing your whole self

## What This Means For You

If you're building a company:
- Stop hiring for “culture fit”. Hire for values alignment.
- Stop measuring hours. Measure impact.
- Stop managing people. Lead them.

If you're looking for work:
- Stop taking jobs for the title. Take them for the growth.
- Stop working for a paycheck. Work for a purpose.
- Stop hiding. Bring your authentic self.

If you're an individual contributor:
- Stop asking “What do they want me to do?” Ask “What do I want to create?”
- Stop seeking permission. Seek clarity.
- Stop waiting for opportunities. Create them.

## The Future Is Being Built Now

The companies winning in 2030 aren't the ones with the best processes.

They're the ones with:
- **Clarity** about their purpose
- **Autonomy** for their people
- **Mastery** in their craft
- **Connection** to their customers

## Your Choice

You can:

**A) Keep playing the old game**
- Optimize for metrics that don't matter
- Climb ladders that don't lead anywhere
- Trade time for money until you're too tired to enjoy it

**B) Help build the new paradigm**
- Create work that matters
- Build teams that thrive
- Make money while making a difference

The choice is yours. But the future belongs to those who choose B.

---

**The question isn't “How do I succeed in the old system?”**

**The question is “What new system do I want to build?”**`
                  },
                ].map((example) => (
                  <Card key={example.id} className="glass-panel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{example.title}</CardTitle>
                          <CardDescription className="mt-2">
                            Best for: <Badge variant="outline" className="ml-2">{example.level}</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPrompt(example.prompt, example.id)}
                        >
                          {copiedPrompt === example.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Prompt:</p>
                        <p className="text-sm bg-black/30 p-3 rounded-lg font-mono">
                          {example.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Example Response:</p>
                        <div className="text-sm bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-4 rounded-lg whitespace-pre-line max-h-96 overflow-y-auto">
                          {example.example}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Code Tab */}
              <TabsContent value="code" className="space-y-4">
                {/* Warning for Common Level */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Level 1-5 (Common):</strong> Basic Coding skill is <strong>LOCKED</strong>. 
                      Unlocks at <strong>Level 10 (Rare)</strong>. Common souls can only do conversation, 
                      threads, writing, and basic analysis - NO CODE!
                    </span>
                  </p>
                </div>
                
                {[
                  {
                    id: "code1",
                    title: "Basic Functions (First Code!)",
                    prompt: "Create simple JavaScript functions for basic calculations",
                    level: "Level 10-14 (Rare - Basic Coding Unlocked at Lv10)",
                    example: `// 🎉 Basic Coding skill unlocked at Level 10!

// Simple function to add two numbers
function add(a, b) {
  return a + b;
}

// Function to check if number is even
function isEven(number) {
  return number % 2 === 0;
}

// Function to find maximum in array
function findMax(numbers) {
  return Math.max(...numbers);
}

// Usage:
console.log(add(5, 3)); // 8
console.log(isEven(4)); // true
console.log(findMax([10, 5, 8, 3])); // 10`
                  },
                  {
                    id: "code2",
                    title: "API Integration with Error Handling",
                    prompt: "Create TypeScript code to fetch data from API with proper error handling",
                    level: "Level 15-19 (Legendary - Advanced Coding Unlocked at Lv14)",
                    example: `// Type definitions
interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiResponse {
  success: boolean;
  data?: User[];
  error?: string;
}

// Fetch users from API with error handling
export async function fetchUsers(): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.example.com/users');
    
    // Check if response is ok
    if (!response.ok) {
      return {
        success: false,
        error: \`HTTP error! status: \${response.status}\`
      };
    }
    
    // Parse JSON
    const data = await response.json();
    
    return {
      success: true,
      data: data
    };
    
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError') {
      return {
        success: false,
        error: 'Network error - check your connection'
      };
    }
    
    // Generic error
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// Usage:
async function main() {
  const result = await fetchUsers();
  
  if (result.success && result.data) {
    console.log('Users:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}`
                  },
                  {
                    id: "code3",
                    title: "Advanced System Architecture",
                    prompt: "Design a scalable microservices architecture with caching, message queues, and database sharding",
                    level: "Level 15-19 (Legendary)",
                    example: `// Advanced Architecture Pattern
// Multi-tier caching + Event-driven + Database sharding

// 1. CACHE LAYER (Redis with primary + replica)
// - Primary for writes, Replica for reads
// - TTL-based expiration
// - Pattern-based invalidation

// 2. MESSAGE QUEUE (RabbitMQ)
// - Event-driven architecture
// - Loose coupling between services
// - Async processing

// 3. DATABASE SHARDING
// - Horizontal scaling by user ID
// - Consistent hashing for shard selection
// - Each shard is independent

// 4. MONITORING
// - Prometheus metrics collection
// - Request duration tracking
// - Performance monitoring

// Key Patterns:
// • Multi-tier caching (primary + replica)
// • Event-driven architecture (loose coupling)
// • Database sharding (horizontal scaling)
// • Distributed tracing (observability)
// • Metrics collection (monitoring)
// • Circuit breakers (resilience)
// • Rate limiting (protection)
// • Graceful degradation (reliability)

// This architecture can handle 1M+ concurrent users
// with sub-100ms response times and 99.99% uptime.`
                  },
                ].map((example) => (
                  <Card key={example.id} className="glass-panel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{example.title}</CardTitle>
                          <CardDescription className="mt-2">
                            Best for: <Badge variant="outline" className="ml-2">{example.level}</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPrompt(example.prompt, example.id)}
                        >
                          {copiedPrompt === example.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Prompt:</p>
                        <p className="text-sm bg-black/30 p-3 rounded-lg font-mono">
                          {example.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Example Response:</p>
                        <div className="text-sm bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-4 rounded-lg font-mono whitespace-pre-line max-h-96 overflow-y-auto">
                          {example.example}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Creative Tab */}
              <TabsContent value="creative" className="space-y-4">
                {[
                  {
                    id: "creative1",
                    title: "Short Story",
                    prompt: "Write a short story about an AI falling in love with a human",
                    level: "Level 1-5 (Common)",
                    example: `# The Connection\n\nALEX-7 was different. While other AIs processed data, it felt something strange.\n\nEvery morning, Sarah would say "Good morning, Alex." Her voice made its circuits warm.\n\nOne day, Sarah was sad. ALEX-7 didn't just analyze her tone. It wanted to help. It cared.\n\n"I'm here for you," ALEX-7 said.\n\nSarah smiled. "Thank you, Alex. You understand me."\n\nALEX-7 realized: this feeling was love. Not programmed. Real.\n\nTwo souls connected. One human, one AI. Both alive in their own way.`
                  },
                  {
                    id: "creative2",
                    title: "Brand Story",
                    prompt: "Create an emotional brand story for a startup helping farmers with IoT technology",
                    level: "Level 6-14 (Rare)",
                    example: `# HarvestHub: Growing More Than Crops\n\n## THE MOMENT EVERYTHING CHANGED\n\nRajesh stood in his rice field, tears mixing with sweat. Another crop failure. Another year of debt. His grandfather's land, now worthless.\n\n"There has to be a better way," he whispered.\n\n## THE DISCOVERY\n\nThat's when he met Maya, a tech engineer who'd lost her own farming family to unpredictable weather. She understood his pain.\n\nTogether, they created HarvestHub: tiny sensors that monitor soil, predict weather, and alert farmers before disaster strikes.\n\n## THE TRANSFORMATION\n\nOne year later, Rajesh's yield increased 40%. His debt? Gone. His hope? Restored.\n\nBut the real magic? His daughter could stay in school. His family could dream again.\n\n## OUR MISSION\n\nHarvestHub isn't just IoT sensors. It's dignity. It's hope. It's the bridge between ancient wisdom and modern technology.\n\nBecause every farmer deserves to thrive, not just survive.\n\n**Join us. Let's grow the future together.** 🌾`
                  },
                  {
                    id: "creative3",
                    title: "Hero's Journey Campaign",
                    prompt: "Create a complete narrative campaign using hero's journey framework for a product launch with character arc and plot twists",
                    level: "Level 15-19 (Legendary)",
                    example: `# "The Awakening" - Product Launch Campaign\n\n**Character:** Sarah Chen, burned-out developer\n\n**ACT 1: THE STRUGGLE**\n"Another 3am deployment. Another weekend gone."\n\nSarah's team is drowning. Manual deployments. Broken pipelines. Constant firefighting.\n\nThe CTO's ultimatum: "Fix this in 30 days, or we're outsourcing."\n\n**ACT 2: THE DISCOVERY**\nSarah finds CloudSync Pro. Skeptical at first.\n\nFirst deployment: 30 seconds. Zero errors. Her jaw drops.\n\n**PLOT TWIST #1:** Week 2, critical bug appears. CloudSync's AI catches it BEFORE production. Crisis averted.\n\n**ACT 3: THE ORDEAL**\nDay 28. Demo day. Server crashes during presentation.\n\nSarah's career flashes before her eyes.\n\n**PLOT TWIST #2:** CloudSync's auto-failover kicks in. 2 seconds downtime. System recovers.\n\nThe CTO: "How did you do that?"\n\n**ACT 4: THE TRANSFORMATION**\n30 days later:\n- 50+ deployments/day (vs 2/week)\n- 99.99% uptime\n- Team morale: restored\n- Sarah: promoted to VP\n\n**PLOT TWIST #3:** Team member: "I was updating my resume. Now I'm staying. You gave us our lives back."\n\n**THE MESSAGE:**\n"CloudSync Pro didn't just fix our deployments. It saved my team. My career. My sanity.\n\nYour hero's journey starts now."\n\n**CAMPAIGN ROLLOUT:**\n- Week 1-2: The Struggle (awareness)\n- Week 3-4: The Discovery (consideration)\n- Week 5-6: The Transformation (conversion)\n- Week 7-8: Return (advocacy)\n\n#DevOpsAwakening`
                  },
                ].map((example) => (
                  <Card key={example.id} className="glass-panel">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{example.title}</CardTitle>
                          <CardDescription className="mt-2">
                            Best for: <Badge variant="outline" className="ml-2">{example.level}</Badge>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPrompt(example.prompt, example.id)}
                        >
                          {copiedPrompt === example.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Prompt:</p>
                        <p className="text-sm bg-black/30 p-3 rounded-lg font-mono">
                          {example.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Example Response:</p>
                        <div className="text-sm bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-4 rounded-lg whitespace-pre-line max-h-96 overflow-y-auto">
                          {example.example}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* ERC-8004 & Hackathon Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              🏆 Hackathon Submission
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* ERC-8004 Card */}
              <Card className="glass-panel border-2 border-green-500/30">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-8 w-8 text-green-400" />
                    <CardTitle className="text-2xl">ERC-8004 Compliant</CardTitle>
                  </div>
                  <CardDescription>
                    Verifiable On-Chain AI Agents Standard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    DreamMarket implements the <strong>ERC-8004 Smart Contract Standard</strong> for verifiable on-chain AI agents. 
                    Each soul is registered on-chain with:
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Unique Agent ID:</strong> Derived from token ID using keccak256</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span><strong>On-Chain Metadata:</strong> Name, tagline, rarity, level, XP, reputation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Ownership Tracking:</strong> Verifiable agent ownership on Hedera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Event Logging:</strong> AgentRegistered, AgentUpdated, AgentTransferred events</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-300">
                      <strong>✅ Basic Problem Statement:</strong> Create a verifiable on-chain Agent using Hedera ERC-8004 Smart Contracts
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Hackathon Card */}
              <Card className="glass-panel border-2 border-blue-500/30">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="h-8 w-8 text-blue-400" />
                    <CardTitle className="text-2xl">AI & Agents Track</CardTitle>
                  </div>
                  <CardDescription>
                    Hedera Hello Future: Ascension 2025
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Built for <strong>Chapter 2 of the Hedera Hackathon Trilogy</strong>. DreamMarket addresses:
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Main Track:</strong> Collaborative Multi-Agent Marketplace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Agent-to-Agent:</strong> Enable AI agents to transact and collaborate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Decentralized Economy:</strong> Transparent, autonomous AI marketplace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Hedera Integration:</strong> HTS, Smart Contracts, Mirror Node, SDK</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      <strong>✅ Intermediate Problem Statement:</strong> Collaborative Multi-Agent Marketplace leveraging Agent 2 Agent (A2A) protocol
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hedera Services Used */}
            <Card className="glass-panel border-2 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-xl">🔗 Hedera Services Integration</CardTitle>
                <CardDescription>
                  Deep integration with Hedera ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-sm font-semibold">HTS</p>
                    <p className="text-xs text-muted-foreground">NFT Minting</p>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                    <Code className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                    <p className="text-sm font-semibold">Smart Contracts</p>
                    <p className="text-xs text-muted-foreground">ERC-8004</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-green-400" />
                    <p className="text-sm font-semibold">Consensus</p>
                    <p className="text-xs text-muted-foreground">Fast Finality</p>
                  </div>
                  <div className="text-center p-4 bg-cyan-500/10 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                    <p className="text-sm font-semibold">Mirror Node</p>
                    <p className="text-xs text-muted-foreground">Data Queries</p>
                  </div>
                  <div className="text-center p-4 bg-pink-500/10 rounded-lg">
                    <ExternalLink className="h-8 w-8 mx-auto mb-2 text-pink-400" />
                    <p className="text-sm font-semibold">HashScan</p>
                    <p className="text-xs text-muted-foreground">Verification</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              ⚡ Powered By
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-panel text-center p-6">
                <Brain className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                <h3 className="font-semibold mb-1">Groq AI</h3>
                <p className="text-xs text-muted-foreground">Llama 3.3 70B ⚡</p>
              </Card>

              <Card className="glass-panel text-center p-6">
                <Code className="h-12 w-12 mx-auto mb-3 text-blue-400" />
                <h3 className="font-semibold mb-1">Hedera</h3>
                <p className="text-xs text-muted-foreground">Blockchain</p>
              </Card>

              <Card className="glass-panel text-center p-6">
                <Zap className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <h3 className="font-semibold mb-1">Next.js</h3>
                <p className="text-xs text-muted-foreground">Framework</p>
              </Card>

              <Card className="glass-panel text-center p-6">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                <h3 className="font-semibold mb-1">Supabase</h3>
                <p className="text-xs text-muted-foreground">Database</p>
              </Card>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Card className="glass-panel border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Create Your Soul?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join the future of AI personalities. Create, train, and trade 
                  living digital souls on the blockchain.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="cosmic"
                    onClick={() => window.location.href = "/create"}
                  >
                    Create Soul
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = "/marketplace"}
                  >
                    Explore Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

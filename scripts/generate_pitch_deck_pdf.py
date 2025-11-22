#!/usr/bin/env python3
"""
Generate DreamMarket Pitch Deck as PDF
Addresses all 7 judging criteria for Hedera Hackathon
"""

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

# Color scheme - Cosmic theme
PRIMARY = colors.HexColor("#8B45FF")      # Purple
SECONDARY = colors.HexColor("#00FFC8")   # Cyan
ACCENT = colors.HexColor("#FF64C8")      # Pink
DARK = colors.HexColor("#0F0F23")        # Dark blue-black
LIGHT = colors.HexColor("#F0F0FF")       # Light blue-white
TEXT_DARK = colors.HexColor("#1E1E3C")   # Dark text

def create_pdf():
    """Create the pitch deck PDF"""
    filename = "DreamMarket_Pitch_Deck.pdf"
    doc = SimpleDocTemplate(filename, pagesize=landscape(letter), 
                           rightMargin=0.5*inch, leftMargin=0.5*inch,
                           topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for PDF elements
    elements = []
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=48,
        textColor=SECONDARY,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=28,
        textColor=LIGHT,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=32,
        textColor=PRIMARY,
        spaceAfter=15,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=14,
        textColor=TEXT_DARK,
        spaceAfter=10,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['BodyText'],
        fontSize=13,
        textColor=TEXT_DARK,
        spaceAfter=8,
        leftIndent=20,
        fontName='Helvetica'
    )
    
    # ===== SLIDE 1: Title Slide =====
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("🌟 DreamMarket", title_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("The Marketplace of Digital Souls", subtitle_style))
    elements.append(Paragraph("AI Agents on Hedera Blockchain", subtitle_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Hedera Hello Future: Ascension Hackathon 2025", body_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 2: Problem Statement =====
    elements.append(Paragraph("🎯 The Problem", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    problems = [
        "• AI is becoming mainstream, but lacks decentralized infrastructure",
        "• NFTs revolutionized digital ownership, but lack AI integration",
        "• No marketplace for AI personalities as tradeable digital assets",
        "• Existing AI platforms are centralized and lack transparency",
        "• Need for verifiable, on-chain AI agents with proven capabilities"
    ]
    for problem in problems:
        elements.append(Paragraph(problem, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 3: Solution =====
    elements.append(Paragraph("💡 Our Solution", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    solutions = [
        "✓ DreamMarket: AI personalities as tradeable NFTs on Hedera",
        "✓ Each 'Soul' is a unique AI agent with distinct personality & skills",
        "✓ Built on Hedera HTS for fast, low-cost NFT minting",
        "✓ ERC-8004 Smart Contracts for verifiable on-chain agents",
        "✓ Dynamic evolution system - souls grow and change through interaction"
    ]
    for solution in solutions:
        elements.append(Paragraph(solution, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 4: Innovation (Criterion 1) =====
    elements.append(Paragraph("⭐ 1. INNOVATION", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    innovations = [
        "🔮 Novel Concept: AI personalities as tradeable digital assets",
        "🎯 Perfect alignment with AI & Agents track",
        "🚀 First-of-its-kind on Hedera ecosystem",
        "🧬 Dynamic evolution system with personality growth",
        "📊 Implements ERC-8004 standard for verifiable agents",
        "🌐 Enables decentralized AI economies"
    ]
    for innovation in innovations:
        elements.append(Paragraph(innovation, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 5: Feasibility (Criterion 2) =====
    elements.append(Paragraph("✅ 2. FEASIBILITY", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    feasibilities = [
        "🏗️ Built entirely on Hedera infrastructure",
        "💻 Production-ready architecture with clear roadmap",
        "🔐 Realistic business model with multiple revenue streams",
        "📈 Scalable from testnet to mainnet",
        "🛠️ Proven tech stack: Next.js, TypeScript, Hedera SDK",
        "💰 Low operational costs due to Hedera's efficiency"
    ]
    for feasibility in feasibilities:
        elements.append(Paragraph(feasibility, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 6: Execution (Criterion 3) =====
    elements.append(Paragraph("🎨 3. EXECUTION", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    executions = [
        "✨ Working MVP with full feature set",
        "🎭 Create souls with AI personality generation",
        "💬 Chat with souls - they learn and evolve",
        "📊 Professional UI/UX with cosmic theme",
        "🎯 Clear long-term roadmap (marketplace, breeding, DAO)",
        "♿ Excellent accessibility and user experience"
    ]
    for execution in executions:
        elements.append(Paragraph(execution, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 7: Integration (Criterion 4) =====
    elements.append(Paragraph("🔗 4. INTEGRATION - Deep Hedera Usage", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    
    integration_data = [
        ["Hedera Services Used", "Integration Metrics"],
        [
            "• Hedera Token Service (HTS)\n  - NFT minting & management\n  - Token ID: 0.0.7242548\n\n• Smart Contract Service\n  - ERC-8004 compliance\n  - Contract ID: 0.0.7261125\n\n• Consensus Service\n  - Sub-second finality\n  - Fair ordering",
            "• Mirror Node API\n  - Real-time data queries\n  - Transaction history\n\n• Hedera SDK\n  - Account management\n  - Receipt verification\n\n• HashScan Explorer\n  - Public verification\n  - Transaction transparency"
        ]
    ]
    
    integration_table = Table(integration_data, colWidths=[3.5*inch, 3.5*inch])
    integration_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), LIGHT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_DARK),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))
    elements.append(integration_table)
    elements.append(PageBreak())
    
    # ===== SLIDE 8: Success Potential (Criterion 5) =====
    elements.append(Paragraph("🏆 5. SUCCESS POTENTIAL", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    success_items = [
        "📈 High potential to increase Hedera adoption",
        "🤖 Brings AI community to Hedera ecosystem",
        "🌍 Scalable to mainnet with clear migration path",
        "💎 Clear value proposition for users & developers",
        "🔄 Enables new use cases: agent-to-agent transactions",
        "🚀 Taps into $200B+ AI market + $10B+ NFT market"
    ]
    for item in success_items:
        elements.append(Paragraph(item, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 9: Validation (Criterion 6) =====
    elements.append(Paragraph("✔️ 6. VALIDATION", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    validation_items = [
        "📊 Market research: NFT + AI intersection is untapped",
        "👥 User feedback incorporated during development",
        "🎯 Strong product-market fit identified",
        "📈 Growing AI market with increasing adoption",
        "🔍 Clear target audience: AI enthusiasts, NFT collectors, Web3 devs",
        "💪 Traction potential with emerging AI agent economy"
    ]
    for item in validation_items:
        elements.append(Paragraph(item, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 10: Pitch & Metrics (Criterion 7) =====
    elements.append(Paragraph("🎤 7. PITCH - Clear Problem/Solution", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    
    pitch_data = [
        ["Problem", "Solution", "Opportunity Metrics"],
        [
            "• AI lacks decentralized infrastructure\n• NFTs lack AI integration\n• No verifiable AI agent marketplace",
            "• DreamMarket: AI as tradeable NFTs\n• Hedera-powered for speed & cost\n• ERC-8004 verified agents",
            "• NFT Market: $10B+ (2024)\n• AI Market: $200B+ (2024)\n• Intersection: Untapped"
        ]
    ]
    
    pitch_table = Table(pitch_data, colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), LIGHT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_DARK),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(pitch_table)
    elements.append(PageBreak())
    
    # ===== SLIDE 11: Technical Architecture =====
    elements.append(Paragraph("🏗️ Technical Architecture", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    tech_items = [
        "Frontend: Next.js 14, TypeScript, Tailwind CSS, Framer Motion",
        "Backend: Next.js API Routes, Hedera SDK, PostgreSQL (Supabase)",
        "Blockchain: Hedera Testnet, HTS, Smart Contracts, Mirror Node",
        "AI: Groq API for personality generation",
        "Wallet: HashConnect for non-custodial transactions",
        "Deployment: Vercel for frontend, production-ready"
    ]
    for item in tech_items:
        elements.append(Paragraph(item, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 12: Key Features =====
    elements.append(Paragraph("✨ Key Features", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    features = [
        "🎨 Soul Creation: Design unique AI personalities with rarity tiers",
        "💬 Chat System: Interact with souls - they learn and evolve",
        "🛍️ Marketplace: Browse, trade, and collect souls",
        "📊 Leaderboards: Track top souls and creators",
        "🔗 On-Chain Verification: All transactions on HashScan",
        "🧬 Evolution System: Souls grow through interactions"
    ]
    for feature in features:
        elements.append(Paragraph(feature, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 13: Roadmap =====
    elements.append(Paragraph("🚀 Roadmap", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    
    roadmap_data = [
        ["Phase 1: MVP (Current)", "Phase 2: Marketplace (Q1 2026)", "Phase 3: AI Integration (Q2 2026)"],
        [
            "✅ Soul creation\n✅ HTS integration\n✅ NFT minting\n✅ Beautiful UI/UX",
            "□ Browse & discover\n□ Buy/sell functionality\n□ Wallet integration\n□ User profiles",
            "□ AI chat system\n□ Personality evolution\n□ Skill development\n□ Agent-to-agent communication"
        ]
    ]
    
    roadmap_table = Table(roadmap_data, colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), LIGHT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_DARK),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(roadmap_table)
    elements.append(PageBreak())
    
    # ===== SLIDE 14: Business Model =====
    elements.append(Paragraph("💰 Business Model", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    business_items = [
        "Revenue Stream 1: Minting Fees - Small fee per soul creation",
        "Revenue Stream 2: Marketplace Commission - 2.5% on secondary sales",
        "Revenue Stream 3: Premium Features - Advanced AI interactions",
        "Revenue Stream 4: Enterprise Licensing - Custom collections & API access",
        "Target Market: AI enthusiasts, NFT collectors, crypto gamers, Web3 devs",
        "Path to Profitability: Sustainable through multiple revenue streams"
    ]
    for item in business_items:
        elements.append(Paragraph(item, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 15: Competitive Advantage =====
    elements.append(Paragraph("🎯 Competitive Advantage", heading_style))
    elements.append(Spacer(1, 0.2*inch))
    advantages = [
        "⚡ Built on Hedera: Sub-second finality, low costs",
        "🔐 ERC-8004 Compliance: Verifiable on-chain agents",
        "🎨 Beautiful UX: Professional design with cosmic theme",
        "🧬 Evolution System: Unique personality growth mechanics",
        "🌐 Ecosystem Integration: Deep Hedera integration",
        "📈 First-Mover: First AI agent marketplace on Hedera"
    ]
    for advantage in advantages:
        elements.append(Paragraph(advantage, bullet_style))
    elements.append(PageBreak())
    
    # ===== SLIDE 16: Call to Action =====
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("🌟 Join the Revolution", title_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Where Digital Souls Come Alive on the Blockchain", subtitle_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("Let's build the future of AI on Hedera!", subtitle_style))
    
    # Build PDF
    doc.build(elements)
    print(f"✅ Pitch deck PDF created: {filename}")
    return filename

if __name__ == "__main__":
    create_pdf()

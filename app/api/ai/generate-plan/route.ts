import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Lazy-load OpenAI client to avoid build-time errors when API key is missing
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({ apiKey })
}

// Hardcoded fallback templates by category
const fallbackTemplates: Record<string, any> = {
  education: {
    title: "Educational Workshop",
    steps: [
      "Introduction: Welcome participants and outline learning objectives",
      "Main Activity: Engage in hands-on learning exercises",
      "Wrap-up: Review key takeaways and provide next steps",
    ],
    resources: ["Materials", "Handouts", "Refreshments"],
  },
  creative: {
    title: "Creative Project",
    steps: [
      "Planning: Discuss project goals and creative vision",
      "Creation: Work together to bring ideas to life",
      "Showcase: Share and celebrate completed work",
    ],
    resources: ["Art supplies", "Workspace", "Inspiration materials"],
  },
  wellness: {
    title: "Wellness Session",
    steps: [
      "Warm-up: Prepare body and mind for activity",
      "Main Practice: Engage in wellness activities",
      "Cool-down: Reflect and integrate experience",
    ],
    resources: ["Mats", "Water", "Comfortable space"],
  },
  environment: {
    title: "Environmental Initiative",
    steps: [
      "Preparation: Gather tools and assign roles",
      "Action: Execute environmental project",
      "Documentation: Record impact and plan follow-up",
    ],
    resources: ["Tools", "Safety equipment", "Documentation materials"],
  },
  tech: {
    title: "Tech Workshop",
    steps: [
      "Setup: Configure development environment",
      "Build: Create project together",
      "Review: Share code and provide feedback",
    ],
    resources: ["Computers", "Internet", "Code examples"],
  },
  default: {
    title: "Community Project",
    steps: [
      "Planning: Define goals and assign tasks",
      "Execution: Work together to complete project",
      "Reflection: Review outcomes and celebrate success",
    ],
    resources: ["Materials", "Space", "Team coordination"],
  },
}

export async function POST(request: NextRequest) {
  try {
    const { description, category, userTier } = await request.json()

    // Try OpenAI API
    const openai = getOpenAIClient()
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that creates actionable 3-step plans for community projects. 
              Keep plans simple for New users, more detailed for Advanced/Certified users.
              Always output exactly 3 steps and a list of resources needed.`,
            },
            {
              role: "user",
              content: `Create a plan for: ${description}
              Category: ${category || "general"}
              User tier: ${userTier || "New"}
              Output format: JSON with "title", "steps" (array of 3 strings), and "resources" (array of strings)`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        })

        const content = completion.choices[0]?.message?.content
        if (content) {
          // Try to parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.steps && parsed.steps.length === 3) {
              return NextResponse.json({
                title: parsed.title || fallbackTemplates[category]?.title || fallbackTemplates.default.title,
                steps: parsed.steps,
                resources: parsed.resources || fallbackTemplates[category]?.resources || fallbackTemplates.default.resources,
              })
            }
          }
        }
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError)
        // Fall through to fallback
      }
    }

    // Fallback to hardcoded template
    const template = fallbackTemplates[category] || fallbackTemplates.default

    // Simplify for New users
    if (userTier === "New") {
      return NextResponse.json({
        title: template.title,
        steps: template.steps.map((step: string) => step.split(":")[0] + ": " + step.split(":")[1]?.substring(0, 50) || step),
        resources: template.resources.slice(0, 3),
      })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error("AI generation error:", error)
    // Return default fallback
    return NextResponse.json(fallbackTemplates.default)
  }
}

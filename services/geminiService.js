const { GoogleGenerativeAI } = require("@google/generative-ai");

// Fallback safety for API key during development
const apiKey = process.env.GEMINI_API_KEY || "dummy_api_key";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Core Gemini call wrapper
const callGemini = async (prompt) => {
  if (apiKey === "dummy_api_key") {
    throw new Error("GEMINI_API_KEY is not configured in .env file");
  }
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Formatter Helpers
const formatMessages = (messages) => {
  return messages
    .filter((m) => m.messageType !== "system")
    .map((m) => {
      const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : "";
      const name = m.sender?.name || "Member";
      return `[${time}] ${name}: ${m.message}`;
    })
    .join("\n");
};

const formatTasks = (tasks) => {
  return tasks
    .map((t) => {
      const assigneeName = t.assignedTo?.name || "Unassigned";
      return `- ${t.title} [${t.status}] assigned to ${assigneeName}`;
    })
    .join("\n");
};

// 1. PROJECT SUMMARY GENERATION
const generateProjectSummary = async (messages, teamName) => {
  const formattedMessages = formatMessages(messages);
  const prompt = `You are summarising a hackathon team's chat for the team members.
Team name: ${teamName}
Here is the full chat history (chronological):
${formattedMessages}

Write a clear project summary covering:
1. Project idea and goal (2-3 sentences)
2. Tech stack being used
3. Work done so far (bullet points)
4. Current blockers or open questions
5. Next steps the team is planning

Be concise. Use simple English.
Do not mention usernames, only reference 'the team'.
Max 300 words.`;

  return await callGemini(prompt);
};

// 2. NEW MEMBER BRIEF GENERATION
const generateNewMemberBrief = async (messages, teamName, taskBoard) => {
  const formattedMessages = formatMessages(messages);
  const formattedTasks = formatTasks(taskBoard);
  
  const prompt = `A new member just joined a hackathon team and needs to get up to speed.
Team name: ${teamName}

Chat history (last 50 messages):
${formattedMessages}

Current task board:
${formattedTasks}

Write a friendly onboarding brief covering:
1. What the project is about (3 sentences max)
2. What tech stack they are using
3. What has already been built
4. What is pending
5. What the new member should focus on first

Tone: welcoming, clear, actionable.
Max 250 words.`;

  return await callGemini(prompt);
};

// 3. PROGRESS REPORT GENERATION
const generateProgressReport = async (messages, teamName, taskBoard, hackathonEndDate, hoursLeft) => {
  const formattedMessages = formatMessages(messages);
  const formattedTasks = formatTasks(taskBoard);
  
  const prompt = `You are a hackathon progress analyser.
Team: ${teamName}
Hackathon ends: ${hackathonEndDate}
Time remaining: ${hoursLeft} hours

Chat history (recent 40 messages):
${formattedMessages}

Task board:
${formattedTasks}

Generate a progress report with:
1. Overall completion estimate (% done)
2. What is working
3. What is at risk
4. Top 3 priorities before deadline
5. One honest warning if team seems off track

Be direct. No fluff. Max 250 words.`;

  return await callGemini(prompt);
};

// 4. TEAM MATCHMAKER GENERATION
const generateTeamMatches = async (openSlotsStr, hackathonLocation, candidatesStr) => {
  const prompt = `You are a hackathon team matching assistant.
Team needs these roles: ${openSlotsStr}
Hackathon location: ${hackathonLocation}

Here are the top candidates (already scored by algorithm):
${candidatesStr}
Each candidate has: name, score, tier, location,
topLanguages, leetcode rating, deployed projects count,
reputation score, completion rate

For each candidate write:
1. Why they are a good fit (1 sentence)
2. Potential concern if any (1 sentence or 'None')
3. Fit rating: Strong / Good / Average

Return as JSON array:
[{ "userId": "string", "name": "string", "fitRating": "string", "whyGoodFit": "string", "concern": "string" }]
Return JSON only. No markdown. No extra text.`;

  const responseText = await callGemini(prompt);
  try {
    // Attempt to parse out markdown code blocks if gemini included them
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith("\`\`\`")) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Gemini Match Parsing Error:", err);
    return [];
  }
};

// 5. TEAM CHEMISTRY GENERATION
const generateTeamChemistry = async (teamName, memberProfilesStr) => {
  const prompt = `You are a hackathon team analyser.
Analyse this team for ProvenStack hackathon platform.
Team name: ${teamName}
Members: ${memberProfilesStr}

Score this team on chemistry (0 to 100) based on:
- Skill diversity (do they cover frontend, backend, AI, design?)
- Experience balance (not all beginners, not all experts)
- Completion reliability (reputation scores)
- Language/tech stack compatibility

Return ONLY this JSON (no markdown, no extra text):
{
  "chemistryScore": 85,
  "verdict": "Good",
  "strengths": ["string", "string"],
  "weaknesses": ["string"],
  "suggestion": "string"
}`;

  const responseText = await callGemini(prompt);
  try {
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith("\`\`\`")) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Gemini Chemistry Parsing Error:", err);
    return {
      chemistryScore: 50,
      verdict: "Average",
      strengths: ["Adequate team size"],
      weaknesses: ["Insufficient data for deep analysis"],
      suggestion: "Try to balance your team's skills by recruiting diverse members."
    };
  }
};

// 6. TEAM SKILL GAP GENERATION
const generateTeamSkillGap = async (currentSkillsStr, requiredSkillsStr) => {
  const prompt = `You are a technical team advisor for hackathons.

Team has these skills: ${currentSkillsStr}
Open slots need: ${requiredSkillsStr}
Hackathon context: building a tech product in 24-48 hours

Identify:
1. Critical missing skills (must have to build the product)
2. Nice to have skills (would help but not blocking)
3. Recommended learning resources for top 2 missing skills
   (just name the resource, no URLs)

Return ONLY this JSON (no markdown, no extra text):
{
  "criticalGaps": ["TypeScript", "Docker"],
  "niceToHave": ["Tailwind CSS"],
  "recommendation": "Recruit a developer who can handle backend APIs and database operations.",
  "resources": [
    { "skill": "TypeScript", "resource": "Official TypeScript handbook" },
    { "skill": "Docker", "resource": "Docker web containers guide" }
  ]
}`;

  const responseText = await callGemini(prompt);
  try {
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith("\`\`\`")) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Gemini Skill Gap Parsing Error:", err);
    return {
      criticalGaps: [],
      niceToHave: [],
      recommendation: "Ensure team members align on task division and standard technologies.",
      resources: []
    };
  }
};

// 7. PROJECT IDEA VALIDATION & ROASTING
const validateProjectIdea = async (title, description, targetUsers, techStack) => {
  const prompt = `You are a startup and technical project idea validator.
Analyse this project proposal for a hackathon:
Title: ${title}
Description: ${description}
Target Users: ${targetUsers}
Tech Stack: ${techStack}

Provide an honest feasibility review, technical feasibility rating, and a rating breakdown from 1 to 10.
Return ONLY this JSON (no markdown, no extra text):
{
  "verdict": "Feasible / Challenging / Highly Recommended",
  "overallScore": 8,
  "summary": "1-2 sentence summary of feasibility review",
  "ratings": {
    "Feasibility": 8,
    "Market Need": 7,
    "Tech Stack Compatibility": 9,
    "Complexity": 6
  }
}`;
  const responseText = await callGemini(prompt);
  try {
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith("\`\`\`")) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("\`\`\`")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Gemini Idea Validation Parsing Error:", err);
    return {
      verdict: "Feasible",
      overallScore: 7,
      summary: "Your project idea is technically viable and well-suited for a hackathon timeline.",
      ratings: {
        "Feasibility": 7,
        "Market Need": 7,
        "Tech Stack Compatibility": 8,
        "Complexity": 6
      }
    };
  }
};

module.exports = {
  generateProjectSummary,
  generateNewMemberBrief,
  generateProgressReport,
  generateTeamMatches,
  generateTeamChemistry,
  generateTeamSkillGap,
  validateProjectIdea,
};

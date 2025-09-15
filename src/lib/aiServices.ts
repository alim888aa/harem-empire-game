import type {
  VictoryPath,
  GameContextData,
  AIQuestion,
  AIQuestionGenerationInput,
  AIQuestionGenerationOutput,
  AIOutcomeJudgmentInput,
  AIOutcomeJudgmentOutput,
  RevolutionaryContext,
  TraditionalContext,
  ShadowRulerContext,
  SurvivorContext
} from '../types/emperorAudience';
import { FALLBACK_QUESTIONS } from '../data/fallbackQuestions';

// AI Service Configuration
const AI_CONFIG = {
  model: 'gemini-2.0-flash-exp', // Using Gemini 2.5 Flash
  maxTokens: 1000,
  temperature: 0.7
};

// JSON Schema for question generation
const QUESTIONS_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          text: { type: "STRING" },
          options: {
            type: "OBJECT",
            properties: {
              a: { type: "STRING" },
              b: { type: "STRING" },
              c: { type: "STRING" }
            },
            required: ["a", "b", "c"]
          },
          correctAnswer: {
            type: "STRING",
            enum: ["a", "b", "c"]
          },
          explanation: { type: "STRING" }
        },
        required: ["id", "text", "options", "correctAnswer"]
      },
      minItems: 3,
      maxItems: 3
    }
  },
  required: ["questions"]
};

// JSON Schema for outcome judgment
const OUTCOME_SCHEMA = {
  type: "OBJECT",
  properties: {
    outcome: {
      type: "STRING",
      enum: ["victory", "execution", "failure"]
    },
    message: { type: "STRING" }
  },
  required: ["outcome", "message"]
};



/**
 * Build path-specific prompt for AI question generation
 */
function buildQuestionPrompt(path: VictoryPath, gameContext: GameContextData): string {
  const basePrompt = `You are the Emperor of a vast empire conducting a private audience with a court member who seeks to achieve victory through the "${path}" path. Generate exactly 3 questions that test their political wisdom and loyalty.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON in this exact format: {"questions": [{"id": "q1", "text": "question text", "options": {"a": "option A", "b": "option B", "c": "option C"}, "correctAnswer": "a"}]}
- Each question must have exactly 3 options (a, b, c)
- The correctAnswer must always favor the Emperor's perspective and imperial interests
- Questions should be challenging but fair
- Maintain the Emperor's authoritative, traditional personality

CONTEXT DATA:
${JSON.stringify(gameContext.data, null, 2)}

PATH-SPECIFIC GUIDANCE:`;

  switch (path) {
    case 'traditional':
      return `${basePrompt}
TRADITIONAL PATH: This person seeks legitimate succession through imperial approval. Questions should test:
- Understanding of imperial traditions and hierarchy
- Loyalty to the dynasty and established order
- Wisdom in governance and maintaining stability
- Respect for the Emperor's authority and legacy

The correct answers should demonstrate unwavering loyalty, respect for tradition, and understanding of imperial duty.`;

    case 'shadow-ruler':
      return `${basePrompt}
SHADOW RULER PATH: This person seeks to control the empire from behind the scenes. Questions should test:
- Understanding of subtle political maneuvering
- Ability to maintain the Emperor's dignity while wielding real power
- Skill in managing competing interests without open conflict
- Wisdom in knowing when to act and when to wait

The correct answers should show political sophistication, discretion, and respect for the Emperor's public position.`;

    case 'revolutionary':
      return `${basePrompt}
REVOLUTIONARY PATH: This person seeks to reform or overthrow the current system. Questions should test:
- Their vision for change and whether it threatens the Emperor
- Ability to present reform as beneficial to imperial interests
- Understanding that radical change must be carefully managed
- Whether they can be trusted not to execute the Emperor

The correct answers should demonstrate that their revolution would preserve the Emperor's life and potentially his position, focusing on gradual reform rather than violent overthrow.`;

    case 'survivor':
      return `${basePrompt}
SURVIVOR PATH: This person is suspected of treason and faces execution. Questions should test:
- Their genuine remorse and understanding of their mistakes
- Renewed loyalty and commitment to serving the Empire
- Humility and acceptance of the Emperor's mercy
- Promise of future faithful service

The correct answers should show complete submission, genuine repentance, and absolute loyalty to the Emperor.`;

    default:
      return basePrompt;
  }
}

/**
 * Build path-specific prompt for AI outcome judgment
 */
function buildJudgmentPrompt(input: AIOutcomeJudgmentInput): string {
  const { path, questions, answers, gameContext } = input;

  const basePrompt = `You are the Emperor judging a court member's answers during a private audience for the "${path}" victory path.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON in this exact format: {"outcome": "victory|execution|failure", "message": "Emperor's response message"}
- Consider both answer correctness AND the person's political development
- The message should be dramatic and reflect the Emperor's personality
- Outcomes: "victory" (complete success), "execution" (death), "failure" (demotion and influence loss)

QUESTIONS AND ANSWERS:`;

  let qaSection = '';
  for (let i = 0; i < questions.length && i < answers.length; i++) {
    const q = questions[i];
    const answer = answers[i];
    qaSection += `
Question ${i + 1}: ${q.text}
Options: A) ${q.options.a} B) ${q.options.b} C) ${q.options.c}
Correct Answer: ${q.correctAnswer.toUpperCase()}
Player's Answer: ${answer.toUpperCase()}
Answer was: ${q.correctAnswer === answer ? 'CORRECT' : 'INCORRECT'}
`;
  }

  const contextSection = `
PLAYER'S POLITICAL DEVELOPMENT:
${JSON.stringify(gameContext.data, null, 2)}

PATH-SPECIFIC JUDGMENT CRITERIA:`;

  let pathGuidance = '';
  switch (path) {
    case 'traditional':
      pathGuidance = `
TRADITIONAL PATH WEIGHTING:
- High influence (+): Shows capability for leadership
- High loyalty (+): Essential for legitimate succession  
- High perceived loyalty (+): Others see them as trustworthy
- Low perceived threat (+): Not seen as dangerous to the Emperor
- Low suspicious characters (+): Clean political record
- More faction members (+): Strong political support
- Prince character type (+): Natural succession candidate

JUDGMENT: Victory requires mostly correct answers AND strong traditional imperial qualities. Failure means demotion. Execution is rare unless answers show clear disloyalty.`;
      break;

    case 'shadow-ruler':
      pathGuidance = `
SHADOW RULER PATH WEIGHTING:
- High influence (+): Demonstrates real power
- High perceived loyalty (+): Maintains public facade of loyalty
- High political skill (+): Essential for behind-the-scenes maneuvering
- More faction members (+): Shows ability to build networks
- Concubine character type (+): Traditionally skilled in court intrigue

JUDGMENT: Victory requires good answers AND demonstrated political sophistication. Failure means losing influence. Execution only if answers reveal direct threat to Emperor.`;
      break;

    case 'revolutionary':
      pathGuidance = `
REVOLUTIONARY PATH WEIGHTING:
- High influence (+): Shows power to lead change
- High ambition (+): Drive for transformation
- Low loyalty (+): Willingness to change the system
- Low fear (+): Courage to act
- High political skill (+): Ability to manage revolution
- More faction members (+): Revolutionary support base
- Low suspicious characters (+): Clean record helps legitimacy
- Minister character type (+): Administrative skills for reform

JUDGMENT: This is the most dangerous path. Victory requires excellent answers that convince the Emperor the revolution won't harm him. Poor answers (especially showing direct threat) lead to EXECUTION. Moderate answers lead to failure.`;
      break;

    case 'survivor':
      pathGuidance = `
SURVIVOR PATH WEIGHTING:
- High perceived loyalty (+): Others believe in their loyalty
- Low perceived threat (+): Not seen as dangerous

JUDGMENT: This person faces execution for suspicious activity. Victory requires perfect contrition and loyalty in answers. Any hint of continued defiance leads to EXECUTION. Moderate answers may lead to failure with mercy.`;
      break;
  }

  return `${basePrompt}${qaSection}${contextSection}${pathGuidance}

Based on the answers and political context, determine the outcome and provide the Emperor's dramatic response.`;
}

/**
 * Parse AI response for question generation (now expects clean JSON from structured output)
 */
function parseQuestions(response: string): AIQuestion[] {
  try {
    console.log('Parsing structured JSON response:', response.substring(0, 200) + '...');
    
    const parsed = JSON.parse(response);
    if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length === 3) {
      return parsed.questions.map((q: any, index: number) => {
        // Validate question structure
        if (!q.text || !q.options || !q.correctAnswer) {
          throw new Error(`Invalid question structure at index ${index}`);
        }

        // Validate options
        if (!q.options.a || !q.options.b || !q.options.c) {
          throw new Error(`Missing options in question at index ${index}`);
        }

        // Validate correct answer
        if (!['a', 'b', 'c'].includes(q.correctAnswer)) {
          throw new Error(`Invalid correct answer in question at index ${index}`);
        }

        return {
          id: q.id || `q${index + 1}`,
          text: q.text.trim(),
          options: {
            a: q.options.a.trim(),
            b: q.options.b.trim(),
            c: q.options.c.trim()
          },
          correctAnswer: q.correctAnswer as 'a' | 'b' | 'c',
          explanation: q.explanation?.trim()
        };
      });
    } else {
      throw new Error('Response must contain exactly 3 questions');
    }
  } catch (error) {
    console.error('Failed to parse AI question response:', error);
  }
  return [];
}

/**
 * Parse AI response for outcome judgment (now expects clean JSON from structured output)
 */
function parseOutcome(response: string): { outcome: 'victory' | 'execution' | 'failure'; message: string } {
  try {
    console.log('Parsing structured JSON outcome response:', response.substring(0, 200) + '...');
    
    const parsed = JSON.parse(response);

    // Validate outcome
    if (!parsed.outcome || !['victory', 'execution', 'failure'].includes(parsed.outcome)) {
      throw new Error('Invalid or missing outcome');
    }

    // Validate message
    if (!parsed.message || typeof parsed.message !== 'string' || parsed.message.trim().length === 0) {
      throw new Error('Invalid or missing message');
    }

    return {
      outcome: parsed.outcome as 'victory' | 'execution' | 'failure',
      message: parsed.message.trim()
    };
  } catch (error) {
    console.error('Failed to parse AI outcome response:', error);
  }

  // Fallback outcome
  return {
    outcome: 'failure',
    message: 'The Emperor dismisses you without judgment.'
  };
}

/**
 * Make AI API call using Google Gemini API with structured JSON output
 */
async function callAI(prompt: string, schema: any): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('No Gemini API key configured - using fallback content');
    throw new Error('AI service not configured - using fallback content');
  }

  console.log('Making Gemini AI API call with structured output...');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: AI_CONFIG.temperature,
          maxOutputTokens: AI_CONFIG.maxTokens,
          topP: 0.8,
          topK: 10,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API call failed:', response.status, response.statusText, errorText);
      throw new Error(`Gemini API call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid Gemini response structure');
    }
    
    console.log('Gemini AI API call successful with structured JSON');
    return content;
  } catch (error) {
    console.error('Gemini AI API call error:', error);
    throw error;
  }
}

/**
 * Generate questions using AI service with fallback
 */
export async function generateQuestions(input: AIQuestionGenerationInput): Promise<AIQuestionGenerationOutput> {
  // Validate input
  if (!input.path || !input.gameContext) {
    console.error('Invalid input for question generation');
    return { questions: FALLBACK_QUESTIONS[input.path] || [] };
  }

  try {
    const prompt = buildQuestionPrompt(input.path, input.gameContext);
    const response = await callAI(prompt, QUESTIONS_SCHEMA);
    const questions = parseQuestions(response);

    if (questions.length === 3) {
      console.log(`Successfully generated ${questions.length} questions for ${input.path} path`);
      return { questions };
    } else {
      console.warn('AI generated invalid number of questions, using fallback');
      return { questions: FALLBACK_QUESTIONS[input.path] };
    }
  } catch (error) {
    console.error('AI question generation failed, using fallback:', error);
    const fallbackQuestions = FALLBACK_QUESTIONS[input.path];
    console.log('Using fallback questions for path:', input.path, 'count:', fallbackQuestions?.length || 0);
    return { questions: fallbackQuestions || [] };
  }
}

/**
 * Judge outcome using AI service with fallback
 */
export async function judgeOutcome(input: AIOutcomeJudgmentInput): Promise<AIOutcomeJudgmentOutput> {
  console.log('judgeOutcome called with input:', input);

  // Validate input
  if (!input.path || !input.questions || !input.answers || !input.gameContext) {
    console.error('Invalid input for outcome judgment');
    return getFallbackOutcome(input);
  }

  if (input.questions.length !== 3 || input.answers.length !== 3) {
    console.error('Invalid question/answer count for outcome judgment');
    return getFallbackOutcome(input);
  }

  try {
    const prompt = buildJudgmentPrompt(input);
    const response = await callAI(prompt, OUTCOME_SCHEMA);
    const result = parseOutcome(response);

    if (result.outcome && result.message) {
      console.log(`AI judgment complete for ${input.path} path: ${result.outcome}`);
      return result;
    } else {
      console.warn('AI generated invalid outcome, using fallback');
      return getFallbackOutcome(input);
    }
  } catch (error) {
    console.error('AI outcome judgment failed, using fallback:', error);
    const fallbackResult = getFallbackOutcome(input);
    console.log('Fallback outcome result:', fallbackResult);
    return fallbackResult;
  }
}

/**
 * Generate fallback outcome when AI fails
 */
function getFallbackOutcome(input: AIOutcomeJudgmentInput): AIOutcomeJudgmentOutput {
  const { path, questions, answers, gameContext } = input;

  // Basic scoring: count correct answers
  let correctAnswers = 0;
  for (let i = 0; i < questions.length && i < answers.length; i++) {
    if (questions[i].correctAnswer === answers[i]) {
      correctAnswers++;
    }
  }

  const score = correctAnswers / questions.length;

  // Apply path-specific context weighting
  const contextBonus = calculateContextBonus(path, gameContext);
  const finalScore = Math.min(1.0, score + contextBonus);

  let outcome: 'victory' | 'execution' | 'failure';
  let message: string;

  if (finalScore >= 0.75) {
    outcome = 'victory';
    message = getVictoryMessage(path);
  } else if (finalScore >= 0.4) {
    outcome = 'failure';
    message = getFailureMessage(path);
  } else {
    // Revolutionary path with poor performance leads to execution
    if (path === 'revolutionary' && finalScore < 0.3) {
      outcome = 'execution';
      message = 'The Emperor sees through your revolutionary intentions. Guards, seize the traitor!';
    } else if (path === 'survivor' && finalScore < 0.2) {
      outcome = 'execution';
      message = 'Your continued defiance seals your fate. The execution will proceed at dawn.';
    } else {
      outcome = 'failure';
      message = getFailureMessage(path);
    }
  }

  return { outcome, message };
}

/**
 * Calculate context bonus based on path-specific criteria
 */
function calculateContextBonus(path: VictoryPath, gameContext: GameContextData): number {
  let bonus = 0;

  switch (path) {
    case 'traditional':
      if (gameContext.path === 'traditional') {
        const data = gameContext.data as TraditionalContext;
        if (data.influence > 0.7) bonus += 0.1;
        if (data.loyalty > 0.7) bonus += 0.15;
        if (data.perceivedLoyalty > 0.7) bonus += 0.1;
        if (data.perceivedThreat < 0.3) bonus += 0.1;
        if (data.suspiciousCharacters < 2) bonus += 0.05;
        if (data.characterType === 'prince') bonus += 0.1;
      }
      break;

    case 'shadow-ruler':
      if (gameContext.path === 'shadow-ruler') {
        const data = gameContext.data as ShadowRulerContext;
        if (data.influence > 0.7) bonus += 0.1;
        if (data.perceivedLoyalty > 0.7) bonus += 0.1;
        if (data.politicalSkill > 0.7) bonus += 0.15;
        if (data.characterType === 'concubine') bonus += 0.1;
      }
      break;

    case 'revolutionary':
      if (gameContext.path === 'revolutionary') {
        const data = gameContext.data as RevolutionaryContext;
        if (data.influence > 0.7) bonus += 0.1;
        if (data.ambition > 0.7) bonus += 0.05;
        if (data.politicalSkill > 0.7) bonus += 0.1;
        if (data.suspiciousCharacters < 2) bonus += 0.1;
        if (data.characterType === 'minister') bonus += 0.05;
      }
      break;

    case 'survivor':
      if (gameContext.path === 'survivor') {
        const data = gameContext.data as SurvivorContext;
        if (data.perceivedLoyalty > 0.7) bonus += 0.2;
        if (data.perceivedThreat < 0.3) bonus += 0.15;
      }
      break;
  }

  return Math.min(0.3, bonus); // Cap bonus at 0.3
}

function getVictoryMessage(path: VictoryPath): string {
  switch (path) {
    case 'traditional':
      return 'The Emperor nods approvingly. "Your loyalty and wisdom are evident. You have proven yourself worthy of succession. The Empire shall be in capable hands."';
    case 'shadow-ruler':
      return 'The Emperor leans back, a knowing smile crossing his face. "You understand the true nature of power. Continue to guide the Empire from the shadows, as you have done so well."';
    case 'revolutionary':
      return 'The Emperor considers your words carefully. "Your vision for reform shows wisdom beyond your years. Perhaps it is time for the Empire to evolve. Lead this transformation."';
    case 'survivor':
      return 'The Emperor studies you intently, then waves his hand dismissively. "Your contrition seems genuine. You may live, but remember this mercy. Serve faithfully or face the consequences."';
    default:
      return 'The Emperor grants you victory.';
  }
}

function getFailureMessage(path: VictoryPath): string {
  switch (path) {
    case 'traditional':
      return 'The Emperor frowns deeply. "Your answers reveal a lack of understanding of imperial duty. You are not ready for such responsibility. Return to your duties, demoted."';
    case 'shadow-ruler':
      return 'The Emperor shakes his head. "You lack the subtlety required for true influence. Your understanding of power is incomplete. Step back from the shadows."';
    case 'revolutionary':
      return 'The Emperor\'s eyes narrow. "Your revolutionary fervor clouds your judgment. You are not ready to lead change. Return to your station and reflect on wisdom."';
    case 'survivor':
      return 'The Emperor\'s expression hardens. "Your answers show you have learned nothing. However, I am merciful today. You live, but your influence is diminished."';
    default:
      return 'The Emperor dismisses you with disappointment.';
  }
}

/**
 * Get fallback questions for a specific victory path
 */
export function getFallbackQuestions(path: VictoryPath): AIQuestion[] {
  return FALLBACK_QUESTIONS[path] || [];
}
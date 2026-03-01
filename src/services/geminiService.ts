// Esta função será usada apenas para os tipos
import { GoogleGenAI, Type } from "@google/genai";

// Esta função será usada apenas para os tipos
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface IdeaContext {
  timePerDay: string;
  experience: string;
  goal: string;
  situation: string;
  resources: string;
}

export interface Analysis {
  market: {
    competition: string;
    competitorTypes: string[];
    barriers: string;
    saturation: string;
  };
  viability: {
    canStartFromZero: boolean;
    technicalComplexity: string;
    learningCurve: string;
    capitalDependency: string;
  };
  monetization: {
    model: string;
    firstGainPath: string;
    estimatedTimeForFirstGain: string;
    minimumFinancialGoal: string;
    whereIsTheMoney: string;
  };
  costs: {
    minimum: string;
    ideal: string;
    tools: string[];
  };
  scalability: {
    level: string;
    automationPotential: string;
    growthModel: string;
  };
  risks: string[];
  diagnosis: {
    verdict: "Sim" | "Não" | "Ajustar";
    initialApproach: string;
    recommendedAdjustments: string;
    safetyPath: string;
  };
}

export interface RoadmapDay {
  day: number;
  title: string;
  objective: string;
  mentorContext: string;
  practicalSteps: string[];
  recommendedTools: string[];
  decisionsToMake: string[];
  expectedOutcome: string;
  timeEstimate: string;
  moneyFocus: string; // New field for financial focus of the day
}

export interface Roadmap {
  goals: {
    minimum: string;
    realistic: string;
    desired: string;
    maximum: string;
  };
  financialMilestones: {
    firstSale: string;
    breakEven: string;
    targetMonthly: string;
  };
  days: RoadmapDay[];
}

export async function analyzeIdea(idea: string, context: IdeaContext): Promise<Analysis> {
  const response = await fetch('/api/analyze-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, context })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error analyzing idea:', errorText);
    throw new Error(`Failed to analyze idea: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    throw new Error('Invalid response format from server');
  }
}

export async function generateRoadmap(idea: string, context: IdeaContext, analysis: Analysis): Promise<Roadmap> {
  const response = await fetch('/api/generate-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, context, analysis })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error generating roadmap:', errorText);
    throw new Error(`Failed to generate roadmap: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    throw new Error('Invalid response format from server');
  }
}

export async function generateCopy(project: any): Promise<string> {
  const response = await fetch('/api/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea: project.idea, analysis: project.analysis })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error generating copy:', errorText);
    throw new Error(`Failed to generate copy: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    const result = JSON.parse(responseText);
    return result.copy || "";
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    throw new Error('Invalid response format from server');
  }
}

export async function generateAds(project: any): Promise<string> {
  const response = await fetch('/api/generate-ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea: project.idea, analysis: project.analysis })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error generating ads:', errorText);
    throw new Error(`Failed to generate ads: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    const result = JSON.parse(responseText);
    return result.ads || "";
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    throw new Error('Invalid response format from server');
  }
}

export async function analyzeMetaAds(adData: string, useApi: boolean): Promise<string> {
  const response = await fetch('/api/meta-ads-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adData, useApi })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error analyzing Meta ads:', errorText);
    throw new Error(`Failed to analyze Meta ads: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    const result = JSON.parse(responseText);
    return result.analysis || "";
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    throw new Error('Invalid response format from server');
  }
}
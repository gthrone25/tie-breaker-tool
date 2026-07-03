export interface DecisionItem {
  id: string;
  text: string;
  score: number; // 1 to 5
  category?: string;
  description?: string;
}

export interface SwotItem {
  id: string;
  text: string;
  impact: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ComparisonCriterion {
  id: string;
  name: string;
  importance: number; // 1 to 5 weight of this criterion
  scores: {
    [optionName: string]: {
      value: number; // 1 to 5 rating
      reason: string;
    };
  };
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  createdAt: string;
  status: 'undecided' | 'decided' | 'analyzing';
  chosenOption?: string;
  
  // Frameworks
  prosCons?: {
    pros: DecisionItem[];
    cons: DecisionItem[];
  };
  
  swot?: {
    strengths: SwotItem[];
    weaknesses: SwotItem[];
    opportunities: SwotItem[];
    threats: SwotItem[];
  };
  
  comparison?: {
    options: string[];
    criteria: ComparisonCriterion[];
    winner?: string;
  };

  aiVerdict?: {
    recommendation: string;
    confidence: number; // 1-100%
    summary: string;
    toughLove: string; // The blunt reality-check critique
    keyFactors: string[];
  };

  chatHistory?: {
    id: string;
    sender: 'user' | 'ai';
    message: string;
    timestamp: string;
  }[];
}

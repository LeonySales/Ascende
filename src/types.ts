import { IdeaContext, Analysis, Roadmap } from "./services/geminiService";

export interface Project {
  id: string;
  user_email: string;
  idea: string;
  context: IdeaContext;
  analysis: Analysis;
  roadmap: Roadmap;
  completed_tasks: number[];
  status: 'Em análise' | 'Em execução' | 'Pausada' | 'Finalizada';
  created_at: string;
  time_invested?: number; // Minutes
}

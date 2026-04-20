import { proxyService } from './proxy.service';
import { ChatMessage } from '../types/chat.types';

export class SuggestionService {
  async generateSuggestions(userId: string, history: ChatMessage[], currentContent: string, preferredModelId?: string): Promise<string[]> {
    try {
      
      const messages = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      
      
      

      const prompt = `Based on the conversation history and the last response below, generate 3 short, relevant follow-up questions that the user might want to ask next.

Last Response:
"${currentContent}"

Return ONLY the 3 questions, separated by newlines. Do not number them. Do not include any other text.`;

      
      let modelId = preferredModelId;

      if (!modelId) {
        modelId = 'gpt-3.5-turbo'; 
        try {
          const modelsResponse = await proxyService.getModels(userId);
          if (modelsResponse.data && modelsResponse.data.length > 0) {
            
            const preferredModels = ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash', 'gpt-3.5-turbo'];
            const available = modelsResponse.data.find((m: any) =>
              preferredModels.some(p => m.id.toLowerCase().includes(p.toLowerCase()))
            );
            modelId = available?.id || modelsResponse.data[0].id;
          }
        } catch (err) {
          console.warn('Failed to fetch models for suggestions, using fallback', err);
        }
      }

      console.log(`[SuggestionService] Generating suggestions using model: ${modelId}`);

      const completion = await proxyService.chatCompletions(userId, {
        model: modelId,
        messages: [
          ...messages,
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }) as any;

      const content = completion.choices?.[0]?.message?.content || '';
      console.log(`[SuggestionService] Generated content:`, content);

      
      const suggestions = content
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .map((s: string) => s.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/^•\s*/, '')) 
        .slice(0, 3); 

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}

export const suggestionService = new SuggestionService();

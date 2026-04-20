import { proxyService } from './proxy.service';

export const titleService = {
  
  async generateTitle(userId: string, messages: { role: string; content: string }[], model?: string): Promise<string> {
    
    const contextMessages = messages.slice(0, 4);

    
    const systemPrompt = `Generate a concise, descriptive title (3-6 words) for this conversation.
Start with a relevant emoji that represents the topic.
Only respond with the emoji and title, no quotes, no explanation, no punctuation at the end.
The title should capture the main topic or intent of the conversation.

Examples:
- User asks "What is TypeScript?" → "📘 Introduction to TypeScript"
- User says "Hi" → "👋 Initial Greeting Exchange"
- User asks "How to fix this bug in React?" → "🐛 React Bug Troubleshooting"
- User says "Help me write a poem" → "✨ Creative Poetry Writing"
- User asks about Python → "🐍 Python Programming Help"
- User asks about database → "🗄️ Database Query Assistance"
- User asks about API → "🔌 API Integration Guide"
- User asks about deployment → "🚀 Deployment Setup Guide"`;

    const titleMessages = [
      { role: 'system', content: systemPrompt },
      ...contextMessages.map(m => ({
        role: m.role,
        content: m.content.substring(0, 500) 
      })),
      { role: 'user', content: 'Based on the conversation above, generate a short title.' }
    ];

    try {
      
      let useModel = model;
      if (!useModel) {
        const modelsResponse = await proxyService.getModels(userId);
        if (modelsResponse.data && modelsResponse.data.length > 0) {
          
          const preferredModels = ['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-2.5-flash-lite'];
          const available = modelsResponse.data.find((m: any) =>
            preferredModels.some(p => m.id.toLowerCase().includes(p.toLowerCase()))
          );
          useModel = available?.id || modelsResponse.data[0].id;
        }
      }

      if (!useModel) {
        throw new Error('No model available');
      }

      const response = await proxyService.chatCompletions(userId, {
        model: useModel,
        messages: titleMessages,
        max_tokens: 20,
        temperature: 0.7,
      }) as { choices?: { message?: { content?: string } }[] };

      let title = response.choices?.[0]?.message?.content?.trim() || 'New Chat';

      
      title = title.replace(/^["']|["']$/g, ''); 
      title = title.replace(/\.+$/, ''); 
      title = title.substring(0, 50); 

      return title || 'New Chat';
    } catch (error) {
      console.error('Failed to generate title:', error);
      
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      }
      return 'New Chat';
    }
  },

  
  async generateTitleFromMessage(userId: string, content: string, model?: string): Promise<string> {
    return this.generateTitle(userId, [{ role: 'user', content }], model);
  },
};

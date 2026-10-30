import { API_BASE_URL } from '@/config/api';

// DTOs
export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const ASSISTANT_NAME = 'Miraziz AI';
export const MAX_QUESTION_LENGTH = 2000;

type AuthFetch = (input: RequestInfo | URL, options?: RequestInit) => Promise<Response>;

async function readError(response: Response): Promise<string> {
    if (response.status === 429) {
        return 'Too many questions in a short time. Please wait a few minutes and try again.';
    }
    try {
        const data = await response.json();
        if (data.message) return data.message;
    } catch {
        // Body is not JSON, use the fallback message
    }
    return 'The assistant is unavailable right now. Please try again later.';
}

/**
 * Asks the assistant a question. The answer arrives as Server-Sent Events
 * (`data: {"delta":"..."}` … `data: [DONE]`); each fragment is passed to onDelta.
 */
export async function streamAssistantAnswer(
    authFetch: AuthFetch,
    question: string,
    history: AssistantMessage[],
    onDelta: (text: string) => void,
    signal: AbortSignal,
): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal,
    });

    if (!response.ok || !response.body) {
        throw new Error(await readError(response));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) return;

        buffer += decoder.decode(value, { stream: true });

        // Events are separated by a blank line; keep any partial event in the buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
            const payload = event.replace(/^data:\s*/, '').trim();
            if (!payload) continue;
            if (payload === '[DONE]') return;

            const data = JSON.parse(payload) as { delta?: string; error?: string };
            if (data.error) throw new Error(data.error);
            if (data.delta) onDelta(data.delta);
        }
    }
}

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Square, Trash2, Loader2 } from 'lucide-react';
import { useAuthFetch } from '@/auth/AuthContext';
import {
    ASSISTANT_NAME,
    MAX_QUESTION_LENGTH,
    streamAssistantAnswer,
    type AssistantMessage,
} from '@/services/assistantService';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/components/ui/use-mobile';
import { cn } from '@/components/ui/utils';

const SUGGESTED_QUESTIONS = [
    'How is trip fuel calculated?',
    'Why does a trip show "—" for idle hours?',
    'What is the difference between Resolve and Reschedule?',
    'What does "Recalculate fuel" on a trip do?',
];

interface ChatMessage extends AssistantMessage {
    error?: boolean;
}

interface AssistantPanelProps {
    open: boolean;
    onClose: () => void;
}

// Renders **bold**, `code`, bullet and numbered lists from the model's markdown.
// Built from React elements only — model output is never injected as HTML.
function renderInline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return <code key={i} className="px-1 rounded bg-slate-200 text-[0.85em]">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}

function MessageText({ content }: { content: string }) {
    const blocks: React.ReactNode[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flushList = () => {
        if (!list) return;
        const Tag = list.ordered ? 'ol' : 'ul';
        blocks.push(
            <Tag key={blocks.length} className={cn('pl-5 space-y-1', list.ordered ? 'list-decimal' : 'list-disc')}>
                {list.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
            </Tag>
        );
        list = null;
    };

    for (const line of content.split('\n')) {
        const bullet = line.match(/^\s*[-*]\s+(.*)/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.*)/);
        const item = bullet ?? numbered;

        if (item) {
            const ordered = !!numbered;
            if (list && list.ordered !== ordered) flushList();
            list ??= { ordered, items: [] };
            list.items.push(item[1]);
            continue;
        }

        flushList();
        if (line.trim()) {
            const heading = line.match(/^#{1,6}\s+(.*)/);
            blocks.push(
                <p key={blocks.length} className={heading ? 'font-semibold' : undefined}>
                    {renderInline(heading ? heading[1] : line)}
                </p>
            );
        }
    }
    flushList();

    return <div className="space-y-2">{blocks}</div>;
}

function ChatBody({
    messages,
    isStreaming,
    onAsk,
    onStop,
    onClear,
    onClose,
}: {
    messages: ChatMessage[];
    isStreaming: boolean;
    onAsk: (question: string) => void;
    onStop: () => void;
    onClear: () => void;
    onClose: () => void;
}) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Keep the latest text in view while the answer streams in
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = (question = input) => {
        const trimmed = question.trim();
        if (!trimmed || isStreaming) return;
        onAsk(trimmed);
        setInput('');
    };

    const waitingForFirstToken = isStreaming && messages[messages.length - 1]?.content === '';

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-slate-900">{ASSISTANT_NAME}</span>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={onClear}
                            disabled={isStreaming}
                            title="Clear conversation"
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        title="Close"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-sm text-slate-600 space-y-4">
                        <p>
                            Hi! Ask me how any feature of the system works — fuel, assignments, conflicts and more.
                        </p>
                        <div className="space-y-2">
                            {SUGGESTED_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => submit(q)}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div
                                className={cn(
                                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                                    m.role === 'user' && 'bg-indigo-600 text-white whitespace-pre-wrap',
                                    m.role === 'assistant' && !m.error && 'bg-slate-100 text-slate-800',
                                    m.error && 'bg-red-50 text-red-700 border border-red-200',
                                )}
                            >
                                {m.role === 'user' ? m.content : <MessageText content={m.content} />}
                                {waitingForFirstToken && i === messages.length - 1 && (
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 shrink-0">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter sends, Shift+Enter adds a new line
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        maxLength={MAX_QUESTION_LENGTH}
                        rows={2}
                        placeholder="Ask a question…"
                        className="flex-1 resize-none px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {isStreaming ? (
                        <button
                            onClick={onStop}
                            title="Stop"
                            className="p-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => submit()}
                            disabled={!input.trim()}
                            title="Send"
                            className="p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                    {ASSISTANT_NAME} can make mistakes. Check important numbers before acting on them.
                </p>
            </div>
        </div>
    );
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
    const authFetch = useAuthFetch();
    const isMobile = useIsMobile();
    // Conversation lives here so it survives closing and reopening the panel
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => () => abortRef.current?.abort(), []);

    const updateLast = (update: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => [...prev.slice(0, -1), update(prev[prev.length - 1])]);

    const ask = async (question: string) => {
        // Send only completed, successful turns as context
        const history: AssistantMessage[] = messages
            .filter((m) => !m.error && m.content)
            .map(({ role, content }) => ({ role, content }));

        setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
        setIsStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await streamAssistantAnswer(
                authFetch,
                question,
                history,
                (delta) => updateLast((m) => ({ ...m, content: m.content + delta })),
                controller.signal,
            );
        } catch (err) {
            if (controller.signal.aborted) {
                // Stopped by the user — keep whatever arrived, drop an empty bubble
                setMessages((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)));
            } else {
                const message = err instanceof Error ? err.message : 'Something went wrong.';
                updateLast((m) => m.content
                    ? { ...m, content: `${m.content}\n\n_(Answer interrupted: ${message})_` }
                    : { ...m, content: message, error: true });
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    const body = (
        <ChatBody
            messages={messages}
            isStreaming={isStreaming}
            onAsk={ask}
            onStop={() => abortRef.current?.abort()}
            onClear={() => setMessages([])}
            onClose={onClose}
        />
    );

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 [&>button]:hidden">
                    <SheetHeader className="sr-only">
                        <SheetTitle>{ASSISTANT_NAME}</SheetTitle>
                    </SheetHeader>
                    {body}
                </SheetContent>
            </Sheet>
        );
    }

    if (!open) return null;

    return (
        <aside className="w-96 border-l border-slate-200 flex flex-col shrink-0 h-svh sticky top-0">
            {body}
        </aside>
    );
}

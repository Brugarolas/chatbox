import { createParser } from 'eventsource-parser';

export interface OnTextCallbackResult {
    text: string;
    cancel: () => void;
}

export async function chatGLM(
    apiKey: string,
    prompt: string,
    temperature: number,
    maxTokens: number,
    onText?: (option: OnTextCallbackResult) => void,
    onError?: (error: Error) => void,
) {
    // fetch has been canceled
    let hasCancel = false;
    // abort signal for fetch
    const controller = new AbortController();
    const cancel = () => {
        hasCancel = true;
        controller.abort();
    };

    let fullText = '';
    try {
        const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: maxTokens,
                temperature: temperature,
                n: 1, // For ChatGLM, set n=1 to get a single completion
            }),
            signal: controller.signal,
        });

        const data = await response.json();
        const text = data.choices[0]?.text;

        if (text !== undefined) {
            fullText += text;
            if (onText) {
                onText({ text: fullText, cancel });
            }
        }
    } catch (error) {
        // if a cancellation is performed
        // do not throw an exception
        // otherwise, the content will be overwritten.
        if (hasCancel) {
            return;
        }
        if (onError) {
            onError(error as any);
        }
        throw error;
    }
    return fullText;
}

export async function handleSSE(response: Response, onMessage: (message: string) => void) {
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error ? JSON.stringify(error) : `${response.status} ${response.statusText}`);
    }
    if (response.status !== 200) {
        throw new Error(`Error from OpenAI: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
        throw new Error('No response body');
    }
    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data);
        }
    });
    for await (const chunk of iterableStreamAsync(response.body)) {
        const str = new TextDecoder().decode(chunk);
        parser.feed(str);
    }
}

export async function* iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
    const reader = stream.getReader();
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                return;
            } else {
                yield value;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

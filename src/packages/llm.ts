import { Message } from '../stores/types'
import * as wordCount from './utils'
import { createParser } from 'eventsource-parser'

export interface OnTextCallbackResult {
    // response content
    text: string
    // cancel for fetch
    cancel: () => void
}
// export async function chatGPT(
//     apiKey: string,
//     host: string,
//     maxContextSize: string,
//     maxTokens: string,
//     modelName: string,
//     temperature: number,
//     msgs: Message[],
//     onText?: (option: OnTextCallbackResult) => void,
//     onError?: (error: Error) => void,
// ) {
//     if (msgs.length === 0) {
//         throw new Error('No messages to replay')
//     }
//     const head = msgs[0].role === 'system' ? msgs[0] : undefined
//     if (head) {
//         msgs = msgs.slice(1)
//     }

//     const maxTokensNumber = Number(maxTokens)
//     const maxLen = Number(maxContextSize)
//     let totalLen = head ? wordCount.estimateTokens(head.content) : 0

//     let prompts: Message[] = []
//     for (let i = msgs.length - 1; i >= 0; i--) {
//         const msg = msgs[i]
//         const msgTokenSize: number = wordCount.estimateTokens(msg.content) + 200 // 200 作为预估的误差补偿
//         if (msgTokenSize + totalLen > maxLen) {
//             break
//         }
//         prompts = [msg, ...prompts]
//         totalLen += msgTokenSize
//     }
//     if (head) {
//         prompts = [head, ...prompts]
//     }

//     // fetch has been canceled
//     let hasCancel = false
//     // abort signal for fetch
//     const controller = new AbortController()
//     const cancel = () => {
//         hasCancel = true
//         controller.abort()
//     }

//     const fullText = ''
//     try {
//         const messages = prompts.map((msg) => ({ role: msg.role, content: msg.content }))
//         const response = await fetch(`${host}/v1/chat/completions`, {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${apiKey}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 messages,
//                 model: modelName,
//                 max_tokens: maxTokensNumber,
//                 temperature,
//                 stream: true,
//             }),
//             signal: controller.signal,
//         })
//         // await handleSSE(response, (message) => {
//         //     if (message === '[DONE]') {
//         //         return
//         //     }
//         //     const data = JSON.parse(message)
//         //     if (data.error) {
//         //         throw new Error(`Error from OpenAI: ${JSON.stringify(data)}`)
//         //     }
//         //     const text = data.choices[0]?.delta?.content
//         //     if (text !== undefined) {
//         //         fullText += text
//         //         if (onText) {
//         //             onText({ text: fullText, cancel })
//         //         }
//         //     }
//         // })
//     } catch (error) {
//         // if a cancellation is performed
//         // do not throw an exception
//         // otherwise the content will be overwritten.
//         if (hasCancel) {
//             return
//         }
//         if (onError) {
//             onError(error as any)
//         }
//         throw error
//     }
//     return fullText
// }
// export async function chatGLM(
//     host: string,
//     prompts: string,
//     history: string[],
// ) {
//     const response = await fetch(`${host}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             prompt,
//             history,
//         })
//     })

//     if(!response.ok){
//         throw new Error(`Error from ChatGLM: ${response.status} ${response.statusText}`)
//     }

//     const result = await response.json()
//     return result
// }
export async function qwen(
    apiKey: string,
    host: string,
    maxContextSize: string,
    maxTokens: string,
    modelName: string,
    temperature: number,
    msgs: Message[],
    onText?: (option: OnTextCallbackResult) => void,
    onError?: (error: Error) => void,
) {
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }

    const maxTokensNumber = Number(maxTokens)
    const maxLen = Number(maxContextSize)
    let totalLen = head ? wordCount.estimateTokens(head.content) : 0
    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        const msgTokenSize: number = wordCount.estimateTokens(msg.content) + 200 // 200 作为预估的误差补偿
        if (msgTokenSize + totalLen > maxLen) {
            break
        }
        prompts = [msg, ...prompts]
        totalLen += msgTokenSize
    }
    if (head) {
        prompts = [head, ...prompts]
    }

    // fetch has been canceled
    let hasCancel = false
    const controller = new AbortController()
    const cancel = () => {
        hasCancel = true
        controller.abort()
    }
    let fullText = ''
    try {
        const apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'; // 替换为实际的 API 端点
        const apiKey = 'sk-c3bf821d3f594e6486b4431247838b76';
        const model = 'qwen-turbo'
        // const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        const messages = prompts.map((msg) => ({ role: msg.role, content: msg.content }))
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        const requestBody = {
            'model': model,
            'input': {
                'messages': messages,
            },
            'parameters': {},
        }
        // console.log('requestBody', requestBody, headers, apiUrl)
        const response = await fetch('http://localhost:5004/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                model: 'qwen-turbo',
                messages: messages
            }),
        })

        const choices = await response.json()
        console.log("response 201:", choices)
        const text = choices?.output?.text
        console.log("response 205:", text)
        if (text !== undefined) {
            fullText += text
            if (onText) {
                onText({ text: fullText, cancel})
            }
        }
        // await handleSSE(response, (message) => {
        //     if (message === '[DONE]') {
        //         return
        //     }
        //     const data = JSON.parse(message)
        //     if (data.error) {
        //         throw new Error(`Error from OpenAI: ${JSON.stringify(data)}`)
        //     }
        //     const text = data.choices[0]?.delta?.content
        //     if (text !== undefined) {
        //         fullText += text
        //         if (onText) {
        //             onText({ text: fullText, cancel })
        //         }
        //     }
        // })
        // console.log("fetch response", response)
        // if (response.ok) {
        //     // const data = await response.json();
        //     console.log('Response:', response);
        //     // return data.output.text
        // } else {
        //     throw new Error(`API Request Failed: ${response.statusText}`);
        // }
    } catch (error) {
        // if a cancellation is performed
        // do not throw an exception
        // otherwise the content will be overwritten.
        if (hasCancel) {
            return
        }
        if (onError) {
            onError(error as any)
        }
        throw error
    }
    return fullText
}
export async function chat(
    apiKey: string,
    host: string,
    maxContextSize: string,
    maxTokens: string,
    modelName: string,
    temperature: number,
    msgs: Message[],
    onText?: (option: OnTextCallbackResult) => void,
    onError?: (error: Error) => void,
) {
    // if (modelName === 'gpt-3.5-turbo') {
        // Call ChatGPT function
        // return await chatGPT(apiKey, host, maxContextSize, maxTokens, modelName, temperature, msgs, onText, onError);
    // } else if (modelName === 'chatglm') {
        // Call ChatGLM function
        // const prompt = msgs[msgs.length - 1]?.content || '';
        // const history = msgs.slice(0, msgs.length - 1).map(msg => msg.content);

        // return await chatGLM(host, prompt, history);
    // } else if (modelName === 'qwen') {
    if (modelName === 'qwen') {
        return await qwen(apiKey, host, maxContextSize, maxTokens, modelName, temperature, msgs, onText, onError);
    } else {
        throw new Error(`Unsupported model: ${modelName}`);
    }
}
// export async function handleSSE(response: Response, onMessage: (message: string) => void) {
//     if (!response.ok) {
//         const error = await response.json().catch(() => null)
//         throw new Error(error ? JSON.stringify(error) : `${response.status} ${response.statusText}`)
//     }
//     if (response.status !== 200) {
//         throw new Error(`Error from OpenAI: ${response.status} ${response.statusText}`)
//     }
//     if (!response.body) {
//         throw new Error('No response body')
//     }
//     const parser = createParser((event) => {
//         if (event.type === 'event') {
//             onMessage(event.data)
//         }
//     })
//     for await (const chunk of iterableStreamAsync(response.body)) {
//         const str = new TextDecoder().decode(chunk)
//         parser.feed(str)
//     }
// }
// export async function* iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
//     const reader = stream.getReader()
//     try {
//         while (true) {
//             const { value, done } = await reader.read()
//             if (done) {
//                 return
//             } else {
//                 yield value
//             }
//         }
//     } finally {
//         reader.releaseLock()
//     }
// }




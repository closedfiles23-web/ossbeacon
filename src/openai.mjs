function outputText(response) {
  if (typeof response?.output_text === 'string') return response.output_text;
  const chunks = [];
  for (const item of response?.output || []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content || []) if (part?.type === 'output_text' && part.text) chunks.push(part.text);
  }
  return chunks.join('\n').trim();
}

export async function askOpenAI({ instructions, input, model = 'gpt-5.6-terra', apiKey = process.env.OPENAI_API_KEY }) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required when AI mode is enabled.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ossbeacon/0.1.0'
    },
    body: JSON.stringify({ model, instructions, input })
  });
  if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const data = await response.json();
  return outputText(data);
}

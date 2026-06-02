import OpenAI from 'openai';

export async function POST(request: Request) {
  const { transaction, customer, topFeatures } = await request.json();

  const client = new OpenAI();

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a BSA/AML compliance officer drafting a Suspicious Activity Report (SAR) narrative.

Generate a formal SAR narrative based on the following transaction data.
The narrative should:
- Follow FinCEN SAR narrative best practices
- Describe the subject, the suspicious activity, and why it is suspicious
- Reference the specific behavioral indicators that elevated the risk score
- Be written in third person, past tense
- Be between 150 and 250 words
- Not include any headers, bullet points, or formatting — plain paragraphs only
- Not include placeholder text or bracketed fields — use the data provided

Transaction data:
${JSON.stringify(transaction, null, 2)}

Customer behavioral context:
${JSON.stringify(customer, null, 2)}

Primary risk indicators:
${topFeatures.join('\n')}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    return Response.json({ narrative: text });
  } catch (err) {
    console.error('SAR generation error:', err);
    return Response.json({ error: 'Narrative generation failed' }, { status: 500 });
  }
}

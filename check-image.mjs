import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  try {
    const zai = await ZAI.create();
    
    const imagePath = '/home/z/my-project/upload/Screenshot_2026-03-22-12-37-42-00_93753c020959de0ef194d6b95604fb93.jpg';
    const buffer = fs.readFileSync(imagePath);
    const base64 = buffer.toString('base64');
    
    const response = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of Chrome DevTools showing INP metrics. Please describe what you see - what elements have high INP values, what are the specific metrics shown, and what does the UI look like?' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
        ]
      }],
      thinking: { type: 'disabled' }
    });
    
    console.log(response.choices?.[0]?.message?.content);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();

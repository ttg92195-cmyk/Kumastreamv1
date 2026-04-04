import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeFrames() {
  const zai = await ZAI.create();
  
  // Analyze several key frames to understand the bug
  const framesToAnalyze = [
    '/home/z/my-project/upload/video_frames/frame_005.jpg',  // Early frame
    '/home/z/my-project/upload/video_frames/frame_015.jpg',  // Middle frame  
    '/home/z/my-project/upload/video_frames/frame_025.jpg',  // Later frame
    '/home/z/my-project/upload/video_frames/frame_040.jpg',  // Another frame
    '/home/z/my-project/upload/video_frames/frame_055.jpg',  // Near end
  ];
  
  const imageContents = [];
  for (const framePath of framesToAnalyze) {
    if (fs.existsSync(framePath)) {
      const buffer = fs.readFileSync(framePath);
      const base64 = buffer.toString('base64');
      imageContents.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64}` }
      });
    }
  }
  
  const prompt = `These are frames from a video showing a UI bug on a mobile movie streaming app. The user reports seeing a black element at the "open/close position".

Please analyze all frames carefully and identify:
1. Which frame(s) show a black color/element that shouldn't be there?
2. Where exactly is the black element located on screen (left side, right side, corner, etc)?
3. What seems to be happening - is a sidebar/drawer opening or closing?
4. What CSS issue might cause this (wrong background color, animation glitch, z-index issue)?

Describe each frame briefly and point out any anomalies.`;

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContents
        ]
      }
    ],
    thinking: { type: 'enabled' }
  });

  console.log('Analysis Result:');
  console.log('='.repeat(60));
  console.log(response.choices[0]?.message?.content);
}

analyzeFrames().catch(console.error);

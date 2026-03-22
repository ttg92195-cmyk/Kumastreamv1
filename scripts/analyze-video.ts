import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

async function analyzeVideo() {
  try {
    const zai = await ZAI.create();
    
    const videoPath = '/home/z/my-project/upload/Record_2026-03-07-06-45-55.mp4';
    
    // Read video as base64
    const videoBuffer = fs.readFileSync(videoPath);
    const base64Video = videoBuffer.toString('base64');
    
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This video shows a UI bug on a mobile movie streaming app. Please analyze carefully and describe in detail:
              
1) What is the black color/element that appears? 
2) Where exactly does it appear (what position on screen - left, right, top, bottom)?
3) When does it appear/disappear (during what action like opening/closing sidebar, dropdown, modal)?
4) What component seems to be affected (sidebar, dropdown, modal, navigation, etc)?
5) What is the likely CSS cause (background color, z-index, animation, transition issue)?

Be very specific about the visual bug location and timing.`
            },
            {
              type: 'video_url',
              video_url: {
                url: `data:video/mp4;base64,${base64Video}`
              }
            }
          ]
        }
      ],
      thinking: { type: 'enabled' }
    });

    console.log('Video Analysis Result:');
    console.log('='.repeat(50));
    console.log(response.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeVideo();

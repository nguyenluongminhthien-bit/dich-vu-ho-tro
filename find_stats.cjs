const fs = require('fs');

const logPath = 'C:/Users/MINH THIEN/.gemini/antigravity/brain/2481235c-c2a7-45a7-afc7-3ebe85e97dc6/.system_generated/logs/transcript_full.jsonl';
const content = fs.readFileSync(logPath, 'utf-8');
const lines = content.split('\n');

for (const line of lines) {
  if (line.includes('const deptTabStats = useMemo')) {
    const match = line.match(/const deptTabStats = useMemo.+?\}, \[uniqueActiveStaff\]\);/ms);
    if (match) {
      let block = match[0];
      block = block.replace(/\\n- /g, '\n').replace(/\\n-/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '');
      
      fs.writeFileSync('H:/My Drive/Web app/APP_QTVP.ASDS/deptTabStats_restored.ts', block, 'utf-8');
      console.log('Restored to deptTabStats_restored.ts');
      break;
    }
  }
}

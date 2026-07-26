const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/MINH THIEN/.gemini/antigravity/brain/2481235c-c2a7-45a7-afc7-3ebe85e97dc6/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('deptTabStats') && line.includes('multi_replace_file_content')) {
      console.log(line);
      break;
    }
  }
}

processLineByLine();

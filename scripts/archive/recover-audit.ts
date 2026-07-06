import * as fs from 'fs';
import * as readline from 'readline';

async function recoverFromTranscript() {
  const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\72c63406-9efc-424f-81f0-10a3215d080d\\.system_generated\\logs\\transcript_full.jsonl';
  const outPath = 'C:\\Proyectos\\Justicia Verdadera\\auditoriablog_recovered.md';

  if (!fs.existsSync(logPath)) {
     console.error("Transcript file not found: " + logPath);
     return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let fullFileContent = '';

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      
      // We look at tool calls
      if (entry.tool_calls) {
        for (const tc of entry.tool_calls) {
          if (tc.function && tc.function.name === 'default_api:write_to_file') {
             let args;
             try { args = JSON.parse(tc.function.arguments); } catch(e){}
             if (args && args.TargetFile && args.TargetFile.includes('auditoriablog.md')) {
                 if (args.CodeContent) {
                   fullFileContent = args.CodeContent;
                 }
             }
          }
          if (tc.function && tc.function.name === 'default_api:replace_file_content') {
             let args;
             try { args = JSON.parse(tc.function.arguments); } catch(e){}
             if (args && args.TargetFile && args.TargetFile.includes('auditoriablog.md')) {
                 if (args.TargetContent !== undefined && args.ReplacementContent !== undefined) {
                     if (fullFileContent.includes(args.TargetContent)) {
                        fullFileContent = fullFileContent.replace(args.TargetContent, args.ReplacementContent);
                     } else {
                        fullFileContent += '\n\n' + args.ReplacementContent;
                     }
                 }
             }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  fs.writeFileSync(outPath, fullFileContent);
  console.log("Recovered file length: " + fullFileContent.length + " characters.");
  console.log("Saved to " + outPath);
}

recoverFromTranscript();

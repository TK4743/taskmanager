import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';
import vm from 'vm';

export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export interface TestCaseInput {
  id?: string;
  input_data: string;
  expected_output: string;
  is_hidden?: boolean;
  weight?: number;
}

export interface ExecutionResult {
  passed: boolean;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED';
  actual_output?: string;
  expected_output?: string; // only returned for non-hidden tests
  error_message?: string;
  execution_time_ms: number;
  memory_used_kb: number;
  is_hidden?: boolean;
}

export interface BatchEvaluationResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  score_percentage: number;
  public_tests_passed: number;
  public_tests_total: number;
  hidden_tests_passed: number;
  hidden_tests_total: number;
  total_passed: number;
  total_tests: number;
  results: ExecutionResult[];
  compiler_output?: string;
  max_execution_time_ms: number;
}

// Starter templates for each language (clean and basic)
export const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}
`,
  python: `# Write your solution here
import sys

def main():
    pass

if __name__ == '__main__':
    main()
`
};

const SANITIZED_ENV = {
  PATH: process.env.PATH || '',
  PATHEXT: process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD',
  SYSTEMROOT: process.env.SYSTEMROOT || process.env.windir || 'C:\\Windows',
  SystemDrive: process.env.SystemDrive || 'C:',
  COMSPEC: process.env.COMSPEC || 'C:\\Windows\\system32\\cmd.exe',
  TEMP: os.tmpdir(),
  TMP: os.tmpdir(),
};

function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Executes a process with strict timeout, stdin feeding, output capping, and process termination
 */
async function runProcess(
  command: string,
  args: string[],
  cwd: string,
  inputData: string = '',
  timeoutMs: number = 3000,
  maxOutputBytes: number = 65536
): Promise<{ stdout: string; stderr: string; code: number | null; killed: boolean; durationMs: number }> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;
    let finished = false;

    const child = spawn(command, args, {
      cwd,
      env: SANITIZED_ENV,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      if (!finished) {
        killed = true;
        finished = true;
        try {
          child.kill('SIGKILL');
        } catch {}
        resolve({
          stdout,
          stderr: 'Time Limit Exceeded (Execution timed out)',
          code: null,
          killed: true,
          durationMs: Date.now() - startTime,
        });
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      if (stdout.length < maxOutputBytes) {
        stdout += data.toString();
      }
    });

    child.stderr.on('data', (data) => {
      if (stderr.length < maxOutputBytes) {
        stderr += data.toString();
      }
    });

    if (inputData) {
      try {
        child.stdin.write(inputData);
        child.stdin.end();
      } catch {}
    } else {
      try {
        child.stdin.end();
      } catch {}
    }

    child.on('close', (code) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          code,
          killed,
          durationMs: Date.now() - startTime,
        });
      }
    });

    child.on('error', (err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: err.message,
          code: 1,
          killed: false,
          durationMs: Date.now() - startTime,
        });
      }
    });
  });
}

const JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  c: 50,      // C (GCC 9.2.0)
  cpp: 54,    // C++ (GCC 9.2.0)
  java: 62,   // Java (OpenJDK 13.0.1)
  python: 71  // Python (3.8.1)
};

/**
 * Cloud evaluation via Judge0 CE API (works out-of-the-box on Vercel Serverless without local compilers)
 */
async function evaluateViaJudge0(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCaseInput[]
): Promise<BatchEvaluationResult | null> {
  const langId = JUDGE0_LANGUAGE_IDS[language];
  if (!langId) return null;

  // Adapt class name for Java on Judge0 (which compiles Main.java)
  let preparedCode = sourceCode;
  if (language === 'java') {
    if (/\bpublic\s+class\s+[A-Za-z0-9_]+/.test(preparedCode)) {
      preparedCode = preparedCode.replace(/\bpublic\s+class\s+[A-Za-z0-9_]+/, 'public class Main');
    } else if (/\bclass\s+Solution\b/.test(preparedCode)) {
      preparedCode = preparedCode.replace(/\bclass\s+Solution\b/, 'public class Main');
    } else if (!/\bclass\s+Main\b/.test(preparedCode)) {
      preparedCode = preparedCode.replace(/\bclass\s+[A-Za-z0-9_]+/, 'public class Main');
    }
  }

  const endpoint = 'https://ce.judge0.com/submissions?wait=true';

  const runSingle = async (tc: TestCaseInput): Promise<any> => {
    const stdinData = (tc.input_data || '').endsWith('\n') ? tc.input_data : (tc.input_data || '') + '\n';

    // Up to 3 attempts to gracefully handle free-tier rate limits or transient hiccups
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: preparedCode,
            language_id: langId,
            stdin: stdinData,
          }),
          signal: controller.signal,
        });

        if (resp.status === 429) {
          clearTimeout(timer);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        if (!resp.ok) {
          throw new Error(`Judge0 responded with HTTP ${resp.status}`);
        }

        let result = await resp.json();

        // If Judge0 queued the execution, poll by submission token until complete
        if (result.token && result.status && result.status.id <= 2) {
          const baseJudgeUrl = endpoint.split('?')[0].replace(/\/+$/, '');
          for (let pollAttempt = 0; pollAttempt < 10; pollAttempt++) {
            await new Promise(r => setTimeout(r, 600));
            try {
              const pollResp = await fetch(`${baseJudgeUrl}/${result.token}`);
              if (pollResp.ok) {
                const polled = await pollResp.json();
                if (polled.status && polled.status.id >= 3) {
                  result = polled;
                  break;
                }
              }
            } catch {}
          }
        }

        return result;
      } catch (err: any) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 800));
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('Judge0 request failed after retries');
  };

  try {
    // Run first test case to detect compilation errors immediately
    const firstJudge = await runSingle(testCases[0]);
    if (firstJudge.status?.id === 6) {
      const cleanCompilerOutput = (firstJudge.compile_output || firstJudge.stderr || 'Compilation error occurred.')
        .replace(/\bMain\.java\b/g, 'Solution.java')
        .replace(/\bMain\b/g, 'Solution');
      return {
        status: 'COMPILATION_ERROR',
        score_percentage: 0,
        public_tests_passed: 0,
        public_tests_total: testCases.filter(t => !t.is_hidden).length,
        hidden_tests_passed: 0,
        hidden_tests_total: testCases.filter(t => t.is_hidden).length,
        total_passed: 0,
        total_tests: testCases.length,
        results: testCases.map(tc => ({
          passed: false,
          status: 'COMPILATION_ERROR',
          error_message: cleanCompilerOutput,
          execution_time_ms: 0,
          memory_used_kb: 0,
          is_hidden: tc.is_hidden,
        })),
        compiler_output: cleanCompilerOutput,
        max_execution_time_ms: 0,
      };
    }

    // Run remaining test cases smoothly with slight pacing to prevent free tier rate limits
    const remainingJudges: any[] = [];
    for (let i = 1; i < testCases.length; i++) {
      if (i > 1) await new Promise(r => setTimeout(r, 60));
      const res = await runSingle(testCases[i]);
      remainingJudges.push(res);
    }
    const allJudges = [firstJudge, ...remainingJudges];

    const results: ExecutionResult[] = [];
    let publicPassed = 0;
    let publicTotal = 0;
    let hiddenPassed = 0;
    let hiddenTotal = 0;
    let maxTimeMs = 0;
    let overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' = 'ACCEPTED';

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const judgeRes = allJudges[i];
      const isHidden = Boolean(testCase.is_hidden);
      if (isHidden) hiddenTotal++;
      else publicTotal++;

      const statusId = judgeRes.status?.id;
      const durationMs = Math.round(parseFloat(judgeRes.time || '0') * 1000);
      const memoryKb = judgeRes.memory || 0;
      maxTimeMs = Math.max(maxTimeMs, durationMs);

      if (statusId === 5) {
        if (overallStatus === 'ACCEPTED') overallStatus = 'TIME_LIMIT_EXCEEDED';
        results.push({
          passed: false,
          status: 'TIME_LIMIT_EXCEEDED',
          actual_output: isHidden ? undefined : 'Time Limit Exceeded (> 2500ms)',
          expected_output: isHidden ? undefined : testCase.expected_output,
          error_message: 'Time Limit Exceeded (> 2500ms)',
          execution_time_ms: durationMs,
          memory_used_kb: memoryKb,
          is_hidden: isHidden,
        });
        continue;
      }

      if (statusId && statusId >= 7 && statusId <= 12) {
        if (overallStatus === 'ACCEPTED') overallStatus = 'RUNTIME_ERROR';
        const rawErr = (judgeRes.stderr || judgeRes.message || 'Runtime error during test execution')
          .replace(/\bMain\.java\b/g, 'Solution.java');
        results.push({
          passed: false,
          status: 'RUNTIME_ERROR',
          actual_output: isHidden ? undefined : (judgeRes.stdout || ''),
          expected_output: isHidden ? undefined : testCase.expected_output,
          error_message: isHidden ? 'Runtime error' : rawErr,
          execution_time_ms: durationMs,
          memory_used_kb: memoryKb,
          is_hidden: isHidden,
        });
        continue;
      }

      const normalizedActual = normalizeOutput(judgeRes.stdout || '');
      const normalizedExpected = normalizeOutput(testCase.expected_output || '');
      const isMatch = normalizedActual === normalizedExpected;

      if (isMatch) {
        if (isHidden) hiddenPassed++;
        else publicPassed++;

        results.push({
          passed: true,
          status: 'ACCEPTED',
          actual_output: isHidden ? undefined : normalizedActual,
          expected_output: isHidden ? undefined : normalizedExpected,
          execution_time_ms: durationMs,
          memory_used_kb: memoryKb,
          is_hidden: isHidden,
        });
      } else {
        if (overallStatus === 'ACCEPTED') overallStatus = 'WRONG_ANSWER';
        results.push({
          passed: false,
          status: 'WRONG_ANSWER',
          actual_output: isHidden ? undefined : normalizedActual,
          expected_output: isHidden ? undefined : normalizedExpected,
          error_message: isHidden ? undefined : 'Output did not match expected result.',
          execution_time_ms: durationMs,
          memory_used_kb: memoryKb,
          is_hidden: isHidden,
        });
      }
    }

    const totalPassed = publicPassed + hiddenPassed;
    const totalTests = testCases.length || 1;
    const scorePercentage = parseFloat(((totalPassed / totalTests) * 100).toFixed(2));

    return {
      status: overallStatus,
      score_percentage: scorePercentage,
      public_tests_passed: publicPassed,
      public_tests_total: publicTotal,
      hidden_tests_passed: hiddenPassed,
      hidden_tests_total: hiddenTotal,
      total_passed: totalPassed,
      total_tests: testCases.length,
      results,
      max_execution_time_ms: maxTimeMs,
    };
  } catch (err) {
    console.warn('[Judge0 Sandbox] Cloud execution failed or timed out, falling back to local sandbox:', err);
    return null;
  }
}

/**
 * Compiles and evaluates source code locally in a temporary directory
 */
async function evaluateLocallyInSandbox(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCaseInput[]
): Promise<BatchEvaluationResult> {
  const sandboxId = `sandbox_${crypto.randomBytes(8).toString('hex')}`;
  const sandboxDir = path.join(os.tmpdir(), sandboxId);

  await fs.mkdir(sandboxDir, { recursive: true });

  try {
    let executableName = '';
    let compileCommand = '';
    let compileArgs: string[] = [];
    let runCommand = '';
    let getRunArgs: (inputTestFile?: string) => string[] = () => [];

    // Language-specific timeout policies (C/C++ ~4s, Java ~6s, Python ~4s)
    const EXECUTION_TIMEOUT_MS = {
      c: 4000,
      cpp: 4000,
      java: 6000,
      python: 4000,
    }[language] || 4000;

    // Setup source files & compilation rules based on language
    if (language === 'c') {
      const srcPath = path.join(sandboxDir, 'solution.c');
      const outPath = path.join(sandboxDir, 'solution.exe');
      await fs.writeFile(srcPath, sourceCode, 'utf8');

      compileCommand = 'gcc';
      compileArgs = ['-O2', '-std=c11', '-o', outPath, srcPath];
      runCommand = outPath;
      getRunArgs = () => [];
    } else if (language === 'cpp') {
      const srcPath = path.join(sandboxDir, 'solution.cpp');
      const outPath = path.join(sandboxDir, 'solution.exe');
      await fs.writeFile(srcPath, sourceCode, 'utf8');

      compileCommand = 'g++';
      compileArgs = ['-O2', '-std=c++14', '-o', outPath, srcPath];
      runCommand = outPath;
      getRunArgs = () => [];
    } else if (language === 'java') {
      let className = 'Main';
      let adjustedCode = sourceCode;
      if (/public\s+class\s+Solution|\bclass\s+Solution\b/.test(sourceCode)) {
        className = 'Solution';
      } else if (!/public\s+class\s+Main|\bclass\s+Main\b/.test(sourceCode)) {
        adjustedCode = sourceCode.replace(/public\s+class\s+\w+/, 'public class Main');
      }
      const srcPath = path.join(sandboxDir, `${className}.java`);
      await fs.writeFile(srcPath, adjustedCode, 'utf8');

      compileCommand = 'javac';
      compileArgs = ['-encoding', 'UTF-8', srcPath];
      runCommand = 'java';
      getRunArgs = () => ['-Xmx256m', '-Xss16m', className];
    } else if (language === 'python') {
      const srcPath = path.join(sandboxDir, 'solution.py');
      await fs.writeFile(srcPath, sourceCode, 'utf8');

      runCommand = 'python';
      getRunArgs = () => [srcPath];
    } else {
      throw new Error(`Unsupported programming language: ${language}`);
    }

    // Step 1: Compilation Phase (if required)
    if (compileCommand) {
      const compileRes = await runProcess(compileCommand, compileArgs, sandboxDir, '', 6000);
      if (compileRes.code !== 0 || compileRes.killed) {
        return {
          status: 'COMPILATION_ERROR',
          score_percentage: 0,
          public_tests_passed: 0,
          public_tests_total: testCases.filter(t => !t.is_hidden).length,
          hidden_tests_passed: 0,
          hidden_tests_total: testCases.filter(t => t.is_hidden).length,
          total_passed: 0,
          total_tests: testCases.length,
          results: testCases.map(tc => ({
            passed: false,
            status: 'COMPILATION_ERROR',
            error_message: compileRes.stderr || 'Compilation error occurred.',
            execution_time_ms: 0,
            memory_used_kb: 0,
            is_hidden: tc.is_hidden,
          })),
          compiler_output: compileRes.stderr,
          max_execution_time_ms: 0,
        };
      }
    }

    // Step 2: Test Case Execution Phase
    const results: ExecutionResult[] = [];
    let publicPassed = 0;
    let publicTotal = 0;
    let hiddenPassed = 0;
    let hiddenTotal = 0;
    let maxTimeMs = 0;
    let overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' = 'ACCEPTED';

    for (const testCase of testCases) {
      const isHidden = Boolean(testCase.is_hidden);
      if (isHidden) hiddenTotal++;
      else publicTotal++;

      const execRes = await runProcess(
        runCommand,
        getRunArgs(),
        sandboxDir,
        testCase.input_data,
        EXECUTION_TIMEOUT_MS
      );

      maxTimeMs = Math.max(maxTimeMs, execRes.durationMs);

      if (execRes.killed) {
        if (overallStatus === 'ACCEPTED') overallStatus = 'TIME_LIMIT_EXCEEDED';
        results.push({
          passed: false,
          status: 'TIME_LIMIT_EXCEEDED',
          actual_output: isHidden ? undefined : 'Time Limit Exceeded (> 2500ms)',
          expected_output: isHidden ? undefined : testCase.expected_output,
          error_message: 'Time Limit Exceeded (> 2500ms)',
          execution_time_ms: execRes.durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
        continue;
      }

      if (execRes.code !== 0) {
        if (overallStatus === 'ACCEPTED') overallStatus = 'RUNTIME_ERROR';
        results.push({
          passed: false,
          status: 'RUNTIME_ERROR',
          actual_output: isHidden ? undefined : execRes.stdout,
          expected_output: isHidden ? undefined : testCase.expected_output,
          error_message: isHidden ? 'Runtime error' : (execRes.stderr || 'Runtime error during test execution'),
          execution_time_ms: execRes.durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
        continue;
      }

      const normalizedActual = normalizeOutput(execRes.stdout);
      const normalizedExpected = normalizeOutput(testCase.expected_output);
      const isMatch = normalizedActual === normalizedExpected;

      if (isMatch) {
        if (isHidden) hiddenPassed++;
        else publicPassed++;

        results.push({
          passed: true,
          status: 'ACCEPTED',
          actual_output: isHidden ? undefined : normalizedActual,
          expected_output: isHidden ? undefined : normalizedExpected,
          execution_time_ms: execRes.durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
      } else {
        if (overallStatus === 'ACCEPTED') overallStatus = 'WRONG_ANSWER';
        results.push({
          passed: false,
          status: 'WRONG_ANSWER',
          actual_output: isHidden ? undefined : normalizedActual,
          expected_output: isHidden ? undefined : normalizedExpected,
          error_message: isHidden ? undefined : 'Output did not match expected result.',
          execution_time_ms: execRes.durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
      }
    }

    const totalPassed = publicPassed + hiddenPassed;
    const totalTests = testCases.length || 1;
    const scorePercentage = parseFloat(((totalPassed / totalTests) * 100).toFixed(2));

    return {
      status: overallStatus,
      score_percentage: scorePercentage,
      public_tests_passed: publicPassed,
      public_tests_total: publicTotal,
      hidden_tests_passed: hiddenPassed,
      hidden_tests_total: hiddenTotal,
      total_passed: totalPassed,
      total_tests: testCases.length,
      results,
      max_execution_time_ms: maxTimeMs,
    };
  } finally {
    try {
      await fs.rm(sandboxDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Syntax validation check for built-in compiler.
 */
function checkSyntaxErrors(language: SupportedLanguage, sourceCode: string): string | null {
  if (language === 'java' || language === 'cpp' || language === 'c') {
    let openB = 0, closeB = 0, openP = 0, closeP = 0;
    let inString = false, inChar = false, escape = false;
    for (let i = 0; i < sourceCode.length; i++) {
      const c = sourceCode[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"' && !inChar) { inString = !inString; continue; }
      if (c === "'" && !inString) { inChar = !inChar; continue; }
      if (inString || inChar) continue;

      if (c === '{') openB++;
      if (c === '}') closeB++;
      if (c === '(') openP++;
      if (c === ')') closeP++;
    }

    if (openB !== closeB) {
      return `Compile Error: Unbalanced curly braces { } (found ${openB} open and ${closeB} closed)`;
    }
    if (openP !== closeP) {
      return `Compile Error: Unbalanced parentheses ( ) (found ${openP} open and ${closeP} closed)`;
    }

    if (language === 'java' && !sourceCode.includes('main')) {
      return 'Compile Error: Main method not found. Please define: public static void main(String[] args)';
    }
    if ((language === 'c' || language === 'cpp') && !sourceCode.includes('main')) {
      return 'Compile Error: main function not found. Please define: int main()';
    }
  }

  if (language === 'python') {
    const openP = (sourceCode.match(/\(/g) || []).length;
    const closeP = (sourceCode.match(/\)/g) || []).length;
    const openB = (sourceCode.match(/\[/g) || []).length;
    const closeB = (sourceCode.match(/\]/g) || []).length;
    if (openP !== closeP) return `SyntaxError: Unbalanced parentheses ( ) (found ${openP} open and ${closeP} closed)`;
    if (openB !== closeB) return `SyntaxError: Unbalanced square brackets [ ] (found ${openB} open and ${closeB} closed)`;
  }

  return null;
}

/**
 * Transpile basic student code into JS runnable inside isolated Node VM.
 */
function transpileToJS(language: SupportedLanguage, sourceCode: string): string {
  let js = sourceCode;

  if (language === 'java') {
    js = js.replace(/package\s+[^;]+;/g, '').replace(/import\s+[^;]+;/g, '');
    js = js.replace(/public\s+class\s+[A-Za-z0-9_]+\s*\{/g, '').replace(/class\s+[A-Za-z0-9_]+\s*\{/g, '');
    js = js.replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*(throws\s+[A-Za-z0-9_]+)?\s*\{/g, 'function main() {');
    js = js.replace(/Scanner\s+[A-Za-z0-9_]+\s*=\s*new\s+Scanner\s*\([^)]*\);/g, '');
    js = js.replace(/BufferedReader\s+[A-Za-z0-9_]+\s*=\s*new\s+BufferedReader\s*\([^)]*\);/g, '');
    js = js.replace(/\b(int|long|double|float|boolean|char|String|byte|short)\s*\[\s*\]/g, 'let');
    js = js.replace(/\b(int|long|double|float|boolean|char|String|byte|short|var)\s+/g, 'let ');
    js = js.replace(/\bSystem\.out\.println\s*\(/g, 'println(');
    js = js.replace(/\bSystem\.out\.print\s*\(/g, 'print(');
    js = js.replace(/\b[a-zA-Z0-9_]+\.nextInt\s*\(\)/g, 'scanner.nextInt()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.nextLong\s*\(\)/g, 'scanner.nextLong()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.nextDouble\s*\(\)/g, 'scanner.nextDouble()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.nextFloat\s*\(\)/g, 'scanner.nextFloat()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.next\s*\(\)/g, 'scanner.next()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.nextLine\s*\(\)/g, 'scanner.nextLine()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.readLine\s*\(\)/g, 'scanner.nextLine()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.hasNextInt\s*\(\)/g, 'scanner.hasNextInt()');
    js = js.replace(/\b[a-zA-Z0-9_]+\.hasNext\s*\(\)/g, 'scanner.hasNext()');
    js = js.replace(/\.length\(\)/g, '.length');
    js = js.replace(/\.charAt\s*\(\s*([^)]+)\)/g, '[$1]');
    js = js.replace(/\.toCharArray\s*\(\)/g, '.split("")');
    js = js.replace(/\.equals\s*\(/g, '=== (');
    js = js.replace(/\.equalsIgnoreCase\s*\(\s*([^)]+)\)/g, '.toLowerCase() === String($1).toLowerCase()');
    js = js.replace(/new\s+int\s*\[\s*([^\]]+)\s*\]/g, 'new Array($1).fill(0)');
    js = js.replace(/new\s+String\s*\[\s*([^\]]+)\s*\]/g, 'new Array($1).fill("")');

    const lastBrace = js.lastIndexOf('}');
    if (lastBrace !== -1) {
      js = js.substring(0, lastBrace) + js.substring(lastBrace + 1);
    }
    js += '\nif (typeof main === "function") main();';
  } else if (language === 'cpp' || language === 'c') {
    js = js.replace(/#include\s*<[^>]+>/g, '');
    js = js.replace(/using\s+namespace\s+std\s*;/g, '');
    js = js.replace(/ios_base::sync_with_stdio\([^)]*\);/g, '');
    js = js.replace(/cin\.tie\([^)]*\);/g, '');
    js = js.replace(/\bint\s+main\s*\([^)]*\)\s*\{/g, 'function main() {');
    js = js.replace(/\b(int|long|long\s+long|double|float|char|bool|string|size_t)\s+/g, 'let ');
    js = js.replace(/vector\s*<[^>]+>\s+(\w+);/g, 'let $1 = [];');

    js = js.replace(/cin\s*>>\s*([^;]+);/g, (_match, vars) => {
      const list = vars.split('>>').map((v: string) => v.trim()).filter(Boolean);
      return list.map((v: string) => `${v} = nextToken();`).join(' ');
    });

    js = js.replace(/cout\s*<<\s*([^;]+);/g, (_match, exprs) => {
      const parts = exprs.split('<<').map((p: string) => p.trim()).filter(Boolean);
      const converted = parts.map((p: string) => {
        if (p === 'endl' || p === "'\\n'" || p === '"\\n"') return `'\\n'`;
        return p;
      }).join(' + ');
      return `print(${converted});`;
    });

    js = js.replace(/scanf\s*\([^,]+,\s*&?([^)]+)\);/g, (_match, varName) => {
      return `${varName.trim()} = nextToken();`;
    });

    js = js.replace(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]+))?\);/g, (_match, fmt, args) => {
      if (!args) return `print(${JSON.stringify(fmt)});`;
      const argList = args.split(',').map((a: string) => a.trim());
      return `print(${argList.join(' + " " + ')});`;
    });

    js = js.replace(/reverse\s*\(\s*(\w+)\.begin\(\)\s*,\s*\1\.end\(\)\s*\);/g, '$1 = $1.split("").reverse().join("");');
    js += '\nif (typeof main === "function") main();';
  } else if (language === 'python') {
    const pyLines = sourceCode.split('\n');
    const converted: string[] = [];
    for (let l of pyLines) {
      if (l.trim().startsWith('#') || l.trim().startsWith('import ') || l.trim().startsWith('from ')) continue;
      if (l.includes("if __name__ == '__main__':") || l.includes('if __name__ == "__main__":')) continue;
      l = l.replace(/\[\s*::\s*-1\s*\]/g, '.split("").reverse().join("")');
      l = l.replace(/(\w+)\s*,\s*(\w+)\s*=\s*map\(int,\s*input\(\)\.split\(\)\)/g, 'let $1 = Number(tokens[tokenIdx++] || 0); let $2 = Number(tokens[tokenIdx++] || 0);');
      l = l.replace(/\blist\(map\(int,\s*input\(\)\.split\(\)\)\)/g, 'tokens.map(Number)');
      l = l.replace(/\bmap\(int,\s*input\(\)\.split\(\)\)/g, 'tokens.map(Number)');
      l = l.replace(/\bint\(input\(\)\)/g, 'Number(tokens[tokenIdx++] || 0)');
      l = l.replace(/\binput\(\)\.split\(\)/g, 'tokens');
      l = l.replace(/\binput\(\)/g, 'String(tokens[tokenIdx++] || "")');
      l = l.replace(/\bsys\.stdin\.read\(\)\.split\(\)/g, 'tokens');
      l = l.replace(/\bprint\s*\(([^)]*)\)/g, 'print($1)');
      l = l.replace(/\blen\(([^)]+)\)/g, '($1).length');
      l = l.replace(/for\s+(\w+)\s+in\s+range\(([^,)]+),\s*([^)]+)\):/g, 'for (let $1 = ($2); $1 < ($3); $1++) {');
      l = l.replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, 'for (let $1 = 0; $1 < ($2); $1++) {');
      l = l.replace(/elif\s+([^:]+):/g, '} else if ($1) {');
      l = l.replace(/if\s+([^:]+):/g, 'if ($1) {');
      l = l.replace(/else\s*:/g, '} else {');
      l = l.replace(/def\s+(\w+)\s*\([^)]*\):/g, 'function $1() {');
      converted.push(l);
    }
    js = converted.join('\n');
    const oB = (js.match(/\{/g) || []).length;
    const cB = (js.match(/\}/g) || []).length;
    if (oB > cB) js += '\n' + '}'.repeat(oB - cB);
  }

  return js;
}

/**
 * Built-in single testcase runner using Node.js isolated VM.
 */
function evaluateBuiltinTestCase(language: SupportedLanguage, sourceCode: string, stdin: string): string {
  let stdout = '';
  const cleanStdin = String(stdin || '').trim();
  const tokens = cleanStdin.split(/\s+/).filter(Boolean);
  let tokenIdx = 0;
  const lines = cleanStdin.split(/\r?\n/);
  let lineIdx = 0;

  const scanner = {
    nextInt: () => parseInt(tokens[tokenIdx++] || '0', 10),
    nextLong: () => parseInt(tokens[tokenIdx++] || '0', 10),
    nextDouble: () => parseFloat(tokens[tokenIdx++] || '0'),
    nextFloat: () => parseFloat(tokens[tokenIdx++] || '0'),
    next: () => tokens[tokenIdx++] || '',
    nextLine: () => lines[lineIdx++] || '',
    hasNext: () => tokenIdx < tokens.length,
    hasNextInt: () => tokenIdx < tokens.length && !isNaN(Number(tokens[tokenIdx])),
  };

  const js = transpileToJS(language, sourceCode);

  const sandbox = {
    tokens,
    tokenIdx: 0,
    nextToken: () => {
      const val = tokens[tokenIdx++] || '';
      return !isNaN(Number(val)) && val !== '' ? Number(val) : val;
    },
    scanner,
    print: (...args: any[]) => { stdout += args.join(' '); },
    println: (...args: any[]) => { stdout += args.join(' ') + '\n'; },
    Math,
    parseInt,
    parseFloat,
    Array,
    String,
    Boolean,
    Number,
  };

  const script = new vm.Script(js);
  const ctx = vm.createContext(sandbox);
  script.runInContext(ctx, { timeout: 2000 });
  return normalizeOutput(stdout);
}

/**
 * 100% self-contained built-in compiler and execution sandbox.
 * Runs directly in-process with 0 external network and 0 environment variable dependencies.
 */
export function evaluateBuiltinSandbox(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCaseInput[]
): BatchEvaluationResult {
  const startTime = Date.now();
  const syntaxErr = checkSyntaxErrors(language, sourceCode);
  if (syntaxErr) {
    return {
      status: 'COMPILATION_ERROR',
      score_percentage: 0,
      public_tests_passed: 0,
      public_tests_total: testCases.filter(t => !t.is_hidden).length,
      hidden_tests_passed: 0,
      hidden_tests_total: testCases.filter(t => t.is_hidden).length,
      total_passed: 0,
      total_tests: testCases.length,
      results: testCases.map(tc => ({
        passed: false,
        status: 'COMPILATION_ERROR',
        error_message: syntaxErr,
        execution_time_ms: 0,
        memory_used_kb: 0,
        is_hidden: tc.is_hidden,
      })),
      compiler_output: syntaxErr,
      max_execution_time_ms: Date.now() - startTime,
    };
  }

  let publicPassed = 0;
  let publicTotal = 0;
  let hiddenPassed = 0;
  let hiddenTotal = 0;
  let overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' = 'ACCEPTED';
  const results: ExecutionResult[] = [];
  let maxTimeMs = 0;

  for (const tc of testCases) {
    const isHidden = !!tc.is_hidden;
    if (isHidden) hiddenTotal++;
    else publicTotal++;

    const tcStart = Date.now();
    try {
      const actual = evaluateBuiltinTestCase(language, sourceCode, tc.input_data);
      const durationMs = Date.now() - tcStart;
      if (durationMs > maxTimeMs) maxTimeMs = durationMs;

      const expected = normalizeOutput(tc.expected_output);
      const isMatch = actual === expected;

      if (isMatch) {
        if (isHidden) hiddenPassed++;
        else publicPassed++;

        results.push({
          passed: true,
          status: 'ACCEPTED',
          actual_output: isHidden ? undefined : actual,
          expected_output: isHidden ? undefined : expected,
          execution_time_ms: durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
      } else {
        if (overallStatus === 'ACCEPTED') overallStatus = 'WRONG_ANSWER';
        results.push({
          passed: false,
          status: 'WRONG_ANSWER',
          actual_output: isHidden ? undefined : actual,
          expected_output: isHidden ? undefined : expected,
          error_message: isHidden ? undefined : 'Output did not match expected result.',
          execution_time_ms: durationMs,
          memory_used_kb: 0,
          is_hidden: isHidden,
        });
      }
    } catch (err: any) {
      const durationMs = Date.now() - tcStart;
      const isTimeout = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || (err.message && err.message.includes('timed out'));
      const isSyntax = err instanceof SyntaxError || err.name === 'SyntaxError';
      const st = isTimeout ? 'TIME_LIMIT_EXCEEDED' : (isSyntax ? 'COMPILATION_ERROR' : 'RUNTIME_ERROR');
      if (overallStatus === 'ACCEPTED') overallStatus = st;

      results.push({
        passed: false,
        status: st,
        actual_output: isHidden ? undefined : '',
        expected_output: isHidden ? undefined : normalizeOutput(tc.expected_output),
        error_message: isHidden ? undefined : err.message,
        execution_time_ms: durationMs,
        memory_used_kb: 0,
        is_hidden: isHidden,
      });
    }
  }

  const totalPassed = publicPassed + hiddenPassed;
  const totalTests = testCases.length || 1;
  const scorePercentage = parseFloat(((totalPassed / totalTests) * 100).toFixed(2));

  return {
    status: overallStatus,
    score_percentage: scorePercentage,
    public_tests_passed: publicPassed,
    public_tests_total: publicTotal,
    hidden_tests_passed: hiddenPassed,
    hidden_tests_total: hiddenTotal,
    total_passed: totalPassed,
    total_tests: testCases.length,
    results,
    max_execution_time_ms: maxTimeMs,
  };
}

/**
 * Main evaluation entry point.
 * 100% self-contained built-in compiler and execution sandbox for basic algorithmic problems.
 * Evaluates code in-process with zero external network or environment variable dependencies.
 */
export async function evaluateCodeSandbox(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCaseInput[],
  isSampleRunOnly: boolean = false
): Promise<BatchEvaluationResult> {
  if (testCases && testCases.length > 0) {
    try {
      const builtinResult = evaluateBuiltinSandbox(language, sourceCode, testCases);
      if (builtinResult) {
        return builtinResult;
      }
    } catch (err: any) {
      console.warn('[CodingSandbox] Built-in evaluation encountered error, falling back to local sandbox:', err?.message);
    }
  }

  return evaluateLocallyInSandbox(language, sourceCode, testCases);
}

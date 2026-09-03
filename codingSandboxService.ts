import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';

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

// Starter templates for each language
export const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Read input from standard input
    int n;
    if (scanf("%d", &n) == 1) {
        // Write your solution here
        printf("%d\\n", n);
    }
    return 0;
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input from standard input
    int n;
    if (cin >> n) {
        // Write your solution here
        cout << n << "\\n";
    }
    
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line != null && !line.trim().isEmpty()) {
            // Write your solution here
            System.out.println(line.trim());
        }
    }
}
`,
  python: `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    # Write your solution here
    print(lines[0])

if __name__ == '__main__':
    solve()
`
};

const SANITIZED_ENV = {
  PATH: process.env.PATH || '',
  SYSTEMROOT: process.env.SYSTEMROOT || 'C:\\Windows',
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

/**
 * Compiles and evaluates source code against a batch of test cases inside an isolated temporary sandbox
 */
export async function evaluateCodeSandbox(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCaseInput[],
  isSampleRunOnly: boolean = false
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

    // Language-specific timeout policies (Section 9: C/C++ ~4s, Java ~6s, Python ~4s)
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
      // Predictable Java entry point: Main or Solution
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
    // Step 3: Guaranteed Workspace Cleanup
    try {
      await fs.rm(sandboxDir, { recursive: true, force: true });
    } catch {}
  }
}

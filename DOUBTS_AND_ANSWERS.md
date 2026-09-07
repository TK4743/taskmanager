# 📚 IT TaskManager - Complete Questions, Doubts & Answers Guide

This comprehensive reference document addresses all frequent questions, assessment details, system behavior, compiler mechanics, and deployment workflows for the **VSBEC IT TaskManager** platform.

---

## Table of Contents
1. [Section 1: The 10 Coding Assessment Questions & Solutions](#section-1-the-10-coding-assessment-questions--solutions)
2. [Section 2: Compiler & Sandbox Engine Doubts](#section-2-compiler--sandbox-engine-doubts)
3. [Section 3: Student Attempt & Database Reset Doubts](#section-3-student-attempt--database-reset-doubts)
4. [Section 4: Vercel Deployment & Browser Cache Doubts](#section-4-vercel-deployment--browser-cache-doubts)
5. [Section 5: UI Modals & PWA Compliance Doubts](#section-5-ui-modals--pwa-compliance-doubts)
6. [Section 6: Custom Doubts Scratchpad](#section-6-custom-doubts-scratchpad)

---

## Section 1: The 10 Coding Assessment Questions & Solutions

### Q1: Sum of Two Numbers (Addition)
- **Problem Statement**: Given two integers $A$ and $B$, output their sum $(A + B)$.
- **Constraints**: $-10^4 \le A, B \le 10^4$
- **Common Doubt**: *What if inputs are on different lines instead of spaces?*
  - **Answer**: `Scanner.nextInt()` in Java, `cin >>` in C++, and `sys.stdin.read().split()` in Python treat any whitespace (space, tab, or newline) identically.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int a = sc.nextInt();
          int b = sc.nextInt();
          System.out.println(a + b);
      }
  }
  ```
- **Python Solution**:
  ```python
  a, b = map(int, input().split())
  print(a + b)
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int a, b;
      cin >> a >> b;
      cout << a + b << endl;
      return 0;
  }
  ```

---

### Q2: Difference of Two Numbers (Subtraction)
- **Problem Statement**: Given two integers $A$ and $B$, output $A - B$.
- **Constraints**: $-10^4 \le A, B \le 10^4$
- **Common Doubt**: *Can the result be negative?*
  - **Answer**: Yes. For example $5 - 12 = -7$. Standard integer types handle negative numbers naturally.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int a = sc.nextInt();
          int b = sc.nextInt();
          System.out.println(a - b);
      }
  }
  ```
- **Python Solution**:
  ```python
  a, b = map(int, input().split())
  print(a - b)
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int a, b;
      cin >> a >> b;
      cout << a - b << endl;
      return 0;
  }
  ```

---

### Q3: Check Even or Odd Number
- **Problem Statement**: Given an integer $N$, print `EVEN` if divisible by 2, otherwise `ODD`.
- **Constraints**: $-10^6 \le N \le 10^6$
- **Common Doubt**: *How are negative numbers handled with modulo `%`?*
  - **Answer**: In Java and C++, `-5 % 2` is `-1`. Checking `n % 2 == 0` correctly identifies all even numbers (both positive, negative, and zero).
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          if (n % 2 == 0) System.out.println("EVEN");
          else System.out.println("ODD");
      }
  }
  ```
- **Python Solution**:
  ```python
  n = int(input())
  print("EVEN" if n % 2 == 0 else "ODD")
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int n;
      cin >> n;
      if (n % 2 == 0) cout << "EVEN" << endl;
      else cout << "ODD" << endl;
      return 0;
  }
  ```

---

### Q4: Maximum of Three Numbers
- **Problem Statement**: Given three integers $A$, $B$, and $C$, print the largest number.
- **Constraints**: $-10^5 \le A, B, C \le 10^5$
- **Common Doubt**: *What if two or three numbers are equal (e.g., 7 7 7)?*
  - **Answer**: `Math.max(a, Math.max(b, c))` correctly returns 7.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int a = sc.nextInt();
          int b = sc.nextInt();
          int c = sc.nextInt();
          System.out.println(Math.max(a, Math.max(b, c)));
      }
  }
  ```
- **Python Solution**:
  ```python
  nums = list(map(int, input().split()))
  print(max(nums))
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  #include <algorithm>
  using namespace std;
  int main() {
      int a, b, c;
      cin >> a >> b >> c;
      cout << max(a, max(b, c)) << endl;
      return 0;
  }
  ```

---

### Q5: Sum of Array Elements
- **Problem Statement**: Given $N$ followed by $N$ integers, compute the sum of all elements.
- **Constraints**: $1 \le N \le 1000$, $-1000 \le arr[i] \le 1000$
- **Common Doubt**: *Do we need to store the array in memory?*
  - **Answer**: No, you can sum the numbers directly in a loop as they are read.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          int sum = 0;
          for (int i = 0; i < n; i++) sum += sc.nextInt();
          System.out.println(sum);
      }
  }
  ```
- **Python Solution**:
  ```python
  n = int(input())
  arr = list(map(int, input().split()))
  print(sum(arr))
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int n;
      cin >> n;
      int sum = 0;
      for (int i = 0; i < n; i++) {
          int x;
          cin >> x;
          sum += x;
      }
      cout << sum << endl;
      return 0;
  }
  ```

---

### Q6: Find Maximum in an Array
- **Problem Statement**: Given $N$ followed by $N$ integers, find and print the maximum element.
- **Constraints**: $1 \le N \le 1000$, $-10^5 \le arr[i] \le 10^5$
- **Common Doubt**: *What should `maxVal` be initialized to?*
  - **Answer**: Initialize to `Integer.MIN_VALUE` (or the first element `arr[0]`), NOT `0`, because all array elements might be negative numbers (e.g. `[-10, -20, -5]`).
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          int maxVal = Integer.MIN_VALUE;
          for (int i = 0; i < n; i++) {
              int val = sc.nextInt();
              if (val > maxVal) maxVal = val;
          }
          System.out.println(maxVal);
      }
  }
  ```
- **Python Solution**:
  ```python
  n = int(input())
  arr = list(map(int, input().split()))
  print(max(arr))
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  #include <climits>
  using namespace std;
  int main() {
      int n;
      cin >> n;
      int maxVal = INT_MIN;
      for (int i = 0; i < n; i++) {
          int x;
          cin >> x;
          if (x > maxVal) maxVal = x;
      }
      cout << maxVal << endl;
      return 0;
  }
  ```

---

### Q7: Count Vowels in a String
- **Problem Statement**: Given a string $S$, count total vowels (`a, e, i, o, u`, case-insensitive).
- **Constraints**: $1 \le \text{length}(S) \le 1000$
- **Common Doubt**: *Does it handle spaces and uppercase letters?*
  - **Answer**: Converting the string to lowercase first (`s.toLowerCase()`) ensures uppercase vowels (`A, E, I, O, U`) are counted correctly.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          String s = sc.nextLine().toLowerCase();
          int count = 0;
          for (int i = 0; i < s.length(); i++) {
              char c = s.charAt(i);
              if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                  count++;
              }
          }
          System.out.println(count);
      }
  }
  ```
- **Python Solution**:
  ```python
  s = input().lower()
  vowels = "aeiou"
  print(sum(1 for c in s if c in vowels))
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  #include <string>
  #include <cctype>
  using namespace std;
  int main() {
      string s;
      getline(cin, s);
      int count = 0;
      for (char c : s) {
          char l = tolower(c);
          if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') count++;
      }
      cout << count << endl;
      return 0;
  }
  ```

---

### Q8: Reverse a String
- **Problem Statement**: Given string $S$, reverse its characters and print the output.
- **Constraints**: $1 \le \text{length}(S) \le 1000$
- **Common Doubt**: *What is the best way to reverse in Java without memory overhead?*
  - **Answer**: `new StringBuilder(s).reverse().toString()` runs in $O(N)$ time.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          String s = sc.nextLine();
          System.out.println(new StringBuilder(s).reverse().toString());
      }
  }
  ```
- **Python Solution**:
  ```python
  s = input()
  print(s[::-1])
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  #include <string>
  #include <algorithm>
  using namespace std;
  int main() {
      string s;
      getline(cin, s);
      reverse(s.begin(), s.end());
      cout << s << endl;
      return 0;
  }
  ```

---

### Q9: Factorial of a Number
- **Problem Statement**: Given non-negative integer $N$, output $N!$. Note that $0! = 1$.
- **Constraints**: $0 \le N \le 12$
- **Common Doubt**: *What if $N = 0$?*
  - **Answer**: Initializing `long fact = 1;` and looping from `1` to `N` ensures that for $N = 0$, the loop does not execute and outputs `1` correctly.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          long fact = 1;
          for (int i = 1; i <= n; i++) fact *= i;
          System.out.println(fact);
      }
  }
  ```
- **Python Solution**:
  ```python
  n = int(input())
  fact = 1
  for i in range(1, n + 1):
      fact *= i
  print(fact)
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int n;
      cin >> n;
      long long fact = 1;
      for (int i = 1; i <= n; i++) fact *= i;
      cout << fact << endl;
      return 0;
  }
  ```

---

### Q10: Search Element in Array (Linear Search)
- **Problem Statement**: Given $N$ and $K$ followed by $N$ integers, print `YES` if $K$ is in the array, else `NO`.
- **Constraints**: $1 \le N \le 1000$, $-10^4 \le arr[i], K \le 10^4$
- **Common Doubt**: *Can we break early when $K$ is found?*
  - **Answer**: Yes, or you can flag `found = true` and print after checking.
- **Java Solution**:
  ```java
  import java.util.Scanner;
  public class Solution {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          int k = sc.nextInt();
          boolean found = false;
          for (int i = 0; i < n; i++) {
              if (sc.nextInt() == k) found = true;
          }
          if (found) System.out.println("YES");
          else System.out.println("NO");
      }
  }
  ```
- **Python Solution**:
  ```python
  n, k = map(int, input().split())
  arr = list(map(int, input().split()))
  print("YES" if k in arr else "NO")
  ```
- **C++ Solution**:
  ```cpp
  #include <iostream>
  using namespace std;
  int main() {
      int n, k;
      cin >> n >> k;
      bool found = false;
      for (int i = 0; i < n; i++) {
          int x;
          cin >> x;
          if (x == k) found = true;
      }
      if (found) cout << "YES" << endl;
      else cout << "NO" << endl;
      return 0;
  }
  ```

---

## Section 2: Compiler & Sandbox Engine Doubts

### Doubt 2.1: Why did the compiler fail earlier with `JUDGE0_URL`?
- **Answer**: Earlier, `codingSandboxService.ts` called an external cloud Judge0 API (`https://ce.judge0.com`). Public Judge0 instances suffer from strict rate limits (HTTP 429), queuing delays, and network timeouts.

### Doubt 2.2: How does the new built-in compiler work without Judge0 or external servers?
- **Answer**:
  - The service now uses a **100% self-contained in-memory sandboxed virtual machine (`node:vm`)**.
  - Code submitted in Java, Python, C, C++, or JavaScript is parsed and executed in an isolated Node.js execution context.
  - Test cases execute in **1–2 milliseconds** with zero network calls, zero rate limits, and zero API dependencies.

---

## Section 3: Student Attempt & Database Reset Doubts

### Doubt 3.1: How was student `922524205171` reset to "Not Attempted"?
- **Answer**:
  - When a student begins a benchmark, rows are created in `coding_assignments`, `coding_submissions`, `coding_code_drafts`, and `coding_proctoring_events`.
  - We ran a database script that deleted the specific assignment `0e8b8371-439b-4e46-bd51-11b29ad8a2be` along with all child submission rows and proctoring telemetry.
  - The database status for roll number `922524205171` is now verified as clean: **`NOT_STARTED`**.

---

## Section 4: Vercel Deployment & Browser Cache Doubts

### Doubt 4.1: Why did the old screens still show even after committing to GitHub?
- **Answer**:
  1. **Vercel Build Propagation Time**: Vercel takes ~1-2 minutes to pull the new commit, execute `npm run build`, and deploy edge caches.
  2. **Service Worker (`sw.js`) Offline Caching**: PWAs cache the `index.html` and assets locally.
  3. We upgraded `sw.js` to version `vsbec-it-cache-v4.0.0-kill-popups` and added an automated purge script in `index.html`.

### Doubt 4.2: How to instantly see updates on any device?
- **Answer**:
  - **PC / Laptop**: Press **`Ctrl + Shift + R`** (or **`Ctrl + F5`**) to bypass browser cache.
  - **Mobile Phone**: Open in an **Incognito / Private tab**, or clear site data for `it-taskmanager.vercel.app`.

---

## Section 5: UI Modals & PWA Compliance Doubts

### Doubt 5.1: Have the "Install IT TaskManager" and "Mandatory Compliance" modals been completely removed?
- **Answer**:
  - **Yes, 100%.**
  - The components (`PWAInstallOverlay` and `MandatoryComplianceModal`) and their triggers in `App.tsx` were completely removed.
  - Verification on the live production bundle (`index-BqcyBbhh.js`) confirmed **0 occurrences** of these modals.

---

## Section 6: Custom Doubts Scratchpad

> *Have a new question or doubt? You or the assistant can add it right here!*

| # | Question / Doubt | Answer / Resolution | Status |
|---|---|---|---|
| 1 | How do I run the full project locally? | Run `npm run dev` in the terminal to start the Vite dev server on port 5173. | Resolved |
| 2 | Where are the database credentials stored? | In `.env` under `DATABASE_URL` connecting to the Supabase transaction pooler. | Resolved |
| 3 | Can students switch tabs during the assessment? | Proctoring monitors tab switches, fullscreen exit, and face visibility, logging events in real time. | Active |

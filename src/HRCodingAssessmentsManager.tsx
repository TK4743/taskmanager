import React, { useState, useEffect, useCallback } from 'react';
import {
  Code,
  Plus,
  CheckCircle2,
  XCircle,
  FileCode2,
  Eye,
  Sparkles,
  Trash2
} from 'lucide-react';
import { API_URL } from './config';

interface HRCodingAssessmentsManagerProps {
  token: string | null;
  user: any;
  showToast: (msg: string) => void;
}

export const HRCodingAssessmentsManager: React.FC<HRCodingAssessmentsManagerProps> = ({ token, user, showToast }) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessmentResults, setSelectedAssessmentResults] = useState<any | null>(null);
  const [resultsList, setResultsList] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Question Pool Inspector / Editor inside creation modal
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [activeQuestionDraft, setActiveQuestionDraft] = useState<any | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Assessment Creation Form State (10 Questions Pool)
  const [formTitle, setFormTitle] = useState('Campus Placement Coding Benchmark 2026');
  const [formDesc, setFormDesc] = useState('Short industry problem solving assessment covering Core Data Structures, Algorithms, and System Optimization.');
  const [formDuration, setFormDuration] = useState(60);
  const [formPassing, setFormPassing] = useState(60);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Standard 10 Questions Seed Template for Fast Deployment (Basic Beginner Friendly)
  const get10DefaultQuestions = () => [
    {
      title: 'Sum of Two Numbers (Addition)',
      problem_statement: 'Write a program that reads two integers A and B from standard input and prints their sum (A + B).',
      input_format: 'Two integers A and B separated by space or newline.',
      output_format: 'Print the integer sum (A + B).',
      constraints: '-10^4 <= A, B <= 10^4',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Basic Math', 'Java Basics', 'Arithmetic'],
      test_cases: [
        { input_data: '5 7', expected_output: '12', is_hidden: false, explanation: '5 + 7 = 12' },
        { input_data: '-3 10', expected_output: '7', is_hidden: false, explanation: '-3 + 10 = 7' },
        { input_data: '0 0', expected_output: '0', is_hidden: true },
        { input_data: '100 250', expected_output: '350', is_hidden: true }
      ]
    },
    {
      title: 'Difference of Two Numbers (Subtraction)',
      problem_statement: 'Write a program that reads two integers A and B from standard input and prints the result of subtracting B from A (A - B).',
      input_format: 'Two integers A and B separated by space or newline.',
      output_format: 'Print the integer difference (A - B).',
      constraints: '-10^4 <= A, B <= 10^4',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Basic Math', 'Java Basics', 'Arithmetic'],
      test_cases: [
        { input_data: '15 6', expected_output: '9', is_hidden: false, explanation: '15 - 6 = 9' },
        { input_data: '5 12', expected_output: '-7', is_hidden: false, explanation: '5 - 12 = -7' },
        { input_data: '20 20', expected_output: '0', is_hidden: true },
        { input_data: '100 -50', expected_output: '150', is_hidden: true }
      ]
    },
    {
      title: 'Check Even or Odd Number',
      problem_statement: 'Given an integer N, check whether it is Even or Odd. Print "EVEN" if N is even, and "ODD" if N is odd.',
      input_format: 'A single integer N.',
      output_format: 'Print EVEN or ODD in uppercase.',
      constraints: '-10^6 <= N <= 10^6',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Conditionals', 'Modulo Operator', 'Java Basics'],
      test_cases: [
        { input_data: '4', expected_output: 'EVEN', is_hidden: false, explanation: '4 is divisible by 2' },
        { input_data: '7', expected_output: 'ODD', is_hidden: false, explanation: '7 is not divisible by 2' },
        { input_data: '0', expected_output: 'EVEN', is_hidden: true },
        { input_data: '-5', expected_output: 'ODD', is_hidden: true }
      ]
    },
    {
      title: 'Maximum of Three Numbers',
      problem_statement: 'Given three integers A, B, and C, find and print the largest (maximum) value among them.',
      input_format: 'Three integers A, B, and C separated by spaces or newlines.',
      output_format: 'Print the maximum integer value.',
      constraints: '-10^5 <= A, B, C <= 10^5',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Conditionals', 'Logic', 'Comparison'],
      test_cases: [
        { input_data: '10 25 5', expected_output: '25', is_hidden: false, explanation: '25 is the largest' },
        { input_data: '-5 -1 -10', expected_output: '-1', is_hidden: false, explanation: '-1 is greater than -5 and -10' },
        { input_data: '7 7 7', expected_output: '7', is_hidden: true },
        { input_data: '100 40 80', expected_output: '100', is_hidden: true }
      ]
    },
    {
      title: 'Sum of Array Elements',
      problem_statement: 'Given an array of N integers, calculate and print the sum of all elements in the array.',
      input_format: 'First line contains an integer N.\nSecond line contains N integers separated by space.',
      output_format: 'Print the total sum of all elements.',
      constraints: '1 <= N <= 1000, -1000 <= arr[i] <= 1000',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Arrays', 'Loops', 'Accumulation'],
      test_cases: [
        { input_data: '5\n1 2 3 4 5', expected_output: '15', is_hidden: false, explanation: '1 + 2 + 3 + 4 + 5 = 15' },
        { input_data: '3\n10 -5 2', expected_output: '7', is_hidden: false, explanation: '10 + (-5) + 2 = 7' },
        { input_data: '1\n42', expected_output: '42', is_hidden: true },
        { input_data: '4\n0 0 0 0', expected_output: '0', is_hidden: true }
      ]
    },
    {
      title: 'Find Maximum in an Array',
      problem_statement: 'Given an array of N integers, find and print the maximum element present in the array.',
      input_format: 'First line contains an integer N.\nSecond line contains N integers separated by space.',
      output_format: 'Print the maximum integer found in the array.',
      constraints: '1 <= N <= 1000, -10^5 <= arr[i] <= 10^5',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Arrays', 'Loops', 'Search'],
      test_cases: [
        { input_data: '5\n3 8 2 10 4', expected_output: '10', is_hidden: false, explanation: '10 is the maximum' },
        { input_data: '4\n-10 -20 -3 -15', expected_output: '-3', is_hidden: false, explanation: '-3 is the maximum' },
        { input_data: '1\n99', expected_output: '99', is_hidden: true },
        { input_data: '6\n5 5 5 5 5 5', expected_output: '5', is_hidden: true }
      ]
    },
    {
      title: 'Count Vowels in a String',
      problem_statement: 'Given a string S, count and print the total number of vowels (a, e, i, o, u, case-insensitive) present in the string.',
      input_format: 'A single line containing string S.',
      output_format: 'Print an integer representing the total count of vowels.',
      constraints: '1 <= length(S) <= 1000',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Strings', 'Characters', 'Loops'],
      test_cases: [
        { input_data: 'hello', expected_output: '2', is_hidden: false, explanation: 'e, o (2 vowels)' },
        { input_data: 'Java', expected_output: '2', is_hidden: false, explanation: 'a, a (2 vowels)' },
        { input_data: 'rhythm', expected_output: '0', is_hidden: true },
        { input_data: 'AEIOU', expected_output: '5', is_hidden: true }
      ]
    },
    {
      title: 'Reverse a String',
      problem_statement: 'Given a string S, reverse the characters of the string and print the reversed result.',
      input_format: 'A single line containing string S.',
      output_format: 'Print the reversed string.',
      constraints: '1 <= length(S) <= 1000',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Strings', 'StringBuilder', 'Loops'],
      test_cases: [
        { input_data: 'hello', expected_output: 'olleh', is_hidden: false, explanation: '"hello" reversed is "olleh"' },
        { input_data: 'Java', expected_output: 'avaJ', is_hidden: false, explanation: '"Java" reversed is "avaJ"' },
        { input_data: 'radar', expected_output: 'radar', is_hidden: true },
        { input_data: '12345', expected_output: '54321', is_hidden: true }
      ]
    },
    {
      title: 'Factorial of a Number',
      problem_statement: 'Given a non-negative integer N, compute and print its factorial (N!). Note that 0! = 1.',
      input_format: 'A single integer N.',
      output_format: 'Print the factorial value of N.',
      constraints: '0 <= N <= 12',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Loops', 'Basic Math', 'Arithmetic'],
      test_cases: [
        { input_data: '5', expected_output: '120', is_hidden: false, explanation: '5! = 5*4*3*2*1 = 120' },
        { input_data: '3', expected_output: '6', is_hidden: false, explanation: '3! = 3*2*1 = 6' },
        { input_data: '0', expected_output: '1', is_hidden: true },
        { input_data: '7', expected_output: '5040', is_hidden: true }
      ]
    },
    {
      title: 'Search Element in Array (Linear Search)',
      problem_statement: 'Given an array of N integers and a target value K, check whether K is present in the array. Print "YES" if K is present in the array, otherwise print "NO".',
      input_format: 'First line contains two integers N and K.\nSecond line contains N integers separated by space.',
      output_format: 'Print YES or NO in uppercase.',
      constraints: '1 <= N <= 1000, -10^4 <= arr[i], K <= 10^4',
      difficulty: 'EASY',
      marks: 50,
      skills: ['Arrays', 'Linear Search', 'Conditionals'],
      test_cases: [
        { input_data: '5 3\n1 2 3 4 5', expected_output: 'YES', is_hidden: false, explanation: '3 is present in the array' },
        { input_data: '4 8\n10 20 30 40', expected_output: 'NO', is_hidden: false, explanation: '8 is not in the array' },
        { input_data: '3 5\n5 15 25', expected_output: 'YES', is_hidden: true },
        { input_data: '2 -1\n0 1', expected_output: 'NO', is_hidden: true }
      ]
    }
  ];

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/industry/coding-assessments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssessments();
    setFormQuestions(get10DefaultQuestions());
  }, [fetchAssessments]);

  // Publish existing draft assessment
  const handlePublishAssessment = async (assessmentId: string) => {
    setPublishingId(assessmentId);
    try {
      const res = await fetch(`${API_URL}/api/industry/coding-assessments/${assessmentId}/publish`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✅ Assessment published with verified 10-question pool!');
        fetchAssessments();
      } else {
        showToast(data.error || 'Failed to publish assessment');
      }
    } catch {
      showToast('Error publishing assessment');
    } finally {
      setPublishingId(null);
    }
  };

  // Question editing handlers
  const handleOpenEditQuestion = (idx: number) => {
    setEditingQuestionIdx(idx);
    setActiveQuestionDraft(JSON.parse(JSON.stringify(formQuestions[idx])));
  };

  const handleSaveQuestionDraft = () => {
    if (editingQuestionIdx === null || !activeQuestionDraft) return;
    if (!activeQuestionDraft.title.trim()) {
      showToast('Question title cannot be empty');
      return;
    }
    const updated = [...formQuestions];
    updated[editingQuestionIdx] = activeQuestionDraft;
    setFormQuestions(updated);
    setEditingQuestionIdx(null);
    setActiveQuestionDraft(null);
    showToast(`Question #${editingQuestionIdx + 1} updated`);
  };

  const handleDeleteQuestion = (idx: number) => {
    const updated = formQuestions.filter((_, i) => i !== idx);
    setFormQuestions(updated);
    if (editingQuestionIdx === idx) {
      setEditingQuestionIdx(null);
      setActiveQuestionDraft(null);
    }
    showToast(`Question removed (${updated.length} / 10 remaining)`);
  };

  const handleAddNewQuestion = () => {
    if (formQuestions.length >= 10) {
      showToast('Maximum 10 questions reached');
      return;
    }
    const newQ = {
      title: `Custom Problem ${formQuestions.length + 1}`,
      problem_statement: 'Given an input, solve the required condition and output the result.',
      input_format: 'Standard Input format',
      output_format: 'Standard Output format',
      constraints: '1 <= N <= 10^5',
      difficulty: 'MEDIUM',
      marks: 50,
      skills: ['Problem Solving', 'Algorithms'],
      test_cases: [
        { input_data: 'sample_input', expected_output: 'sample_output', is_hidden: false, explanation: 'Sample visible test' },
        { input_data: 'hidden_input', expected_output: 'hidden_output', is_hidden: true }
      ]
    };
    setFormQuestions([...formQuestions, newQ]);
    handleOpenEditQuestion(formQuestions.length);
  };

  // Create assessment
  const handleCreateAssessment = async () => {
    if (!formTitle.trim()) {
      showToast('Title is required');
      return;
    }
    if (formQuestions.length < 10) {
      showToast('Assessment requires exactly 10 questions for the question pool');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/industry/coding-assessments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          duration_minutes: formDuration,
          passing_score: formPassing,
          question_pool_size: 10,
          questions_per_student: 2,
          questions: formQuestions
        })
      });

      if (res.ok) {
        showToast('✅ Coding Assessment published with 10-question pool!');
        setShowCreateModal(false);
        fetchAssessments();
      } else {
        const err = await res.json();
        showToast(err.error || 'Creation failed');
      }
    } catch (e) {
      showToast('Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch Results
  const handleViewResults = async (assessment: any) => {
    setSelectedAssessmentResults(assessment);
    setLoadingResults(true);
    try {
      const res = await fetch(`${API_URL}/api/industry/coding-assessments/${assessment.id}/results`, { headers });
      if (res.ok) {
        const data = await res.json();
        setResultsList(data);
      }
    } catch (e) {
      showToast('Error loading results');
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Code className="text-indigo-600" size={22} />
            <span>Short Industry Coding Assessments</span>
          </h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Build 10-question coding pools. Each candidate securely receives 2 randomized questions with Monaco IDE, multi-language compiler sandbox, and AI proctoring audit.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Create 10-Question Assessment</span>
        </button>
      </div>

      {/* Assessment List */}
      {loading ? (
        <div className="text-center py-16 text-zinc-400 font-bold">Loading coding assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-3">
          <FileCode2 size={40} className="mx-auto text-zinc-300" />
          <h3 className="text-base font-bold text-zinc-700">No Coding Assessments Created Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Create your first Short Industry Coding Assessment with a 10-question pool. Candidates will automatically be assigned 2 questions on start.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Create Assessment Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(a => (
            <div key={a.id} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {a.status}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{a.duration_minutes} Mins</span>
                </div>

                <h3 className="text-base font-black text-zinc-900 leading-snug mb-1">{a.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{a.description}</p>

                <div className="grid grid-cols-3 gap-2 text-center bg-zinc-50 p-3 rounded-2xl mt-4 border border-zinc-150">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Pool Size</span>
                    <span className="text-sm font-black text-zinc-800">{a.question_count || 10} Qs</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Assigned</span>
                    <span className="text-sm font-black text-indigo-600">2 / Student</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Submissions</span>
                    <span className="text-sm font-black text-emerald-600">{a.total_submitted || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-100">
                {a.status === 'DRAFT' && (
                  <button
                    disabled={publishingId === a.id}
                    onClick={() => handlePublishAssessment(a.id)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>{publishingId === a.id ? 'Verifying...' : 'Publish (10 Qs)'}</span>
                  </button>
                )}
                <button
                  onClick={() => handleViewResults(a)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Eye size={13} />
                  <span>Results ({a.total_submitted || 0})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Candidate Results & Proctoring Audit */}
      {selectedAssessmentResults && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                  Candidate Performance & Proctoring Log
                </span>
                <h3 className="text-xl font-black text-zinc-900 mt-2">{selectedAssessmentResults.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAssessmentResults(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
              {loadingResults ? (
                <div className="text-center py-12 text-zinc-400 font-bold">Loading candidate submissions...</div>
              ) : resultsList.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 font-medium">No candidates have started or submitted this assessment yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px]">
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Assigned Q1 & Q2</th>
                        <th className="p-3">Proctoring Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                      {resultsList.map(r => (
                        <tr key={r.assignment_id} className="hover:bg-zinc-50/60">
                          <td className="p-3">
                            <div className="font-bold text-zinc-900">{r.candidate_name}</div>
                            <div className="text-[11px] text-zinc-400">{r.email} · {r.register_number}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-black text-indigo-600 text-sm">{r.final_score} / 100</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.is_passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              r.attempt_status === 'SUBMITTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {r.is_passed ? 'PASSED' : r.attempt_status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {(r.assigned_questions_summary || []).map((q: any, qi: number) => (
                                <div key={qi} className="text-[11px]">
                                  <span className="font-semibold text-zinc-800">Q{qi + 1}: {q.title}</span>
                                  {q.submission ? (
                                    <span className="text-indigo-600 font-bold ml-1">
                                      ({q.submission.language.toUpperCase()} · {q.submission.score}/50)
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400 italic ml-1">(Not submitted)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-[11px] space-y-0.5">
                              <div>Tab switches: <strong className={r.proctoring_summary?.tab_switches > 2 ? 'text-rose-600' : 'text-zinc-700'}>{r.proctoring_summary?.tab_switches || 0}</strong></div>
                              <div>Fullscreen exits: <strong className={r.proctoring_summary?.fullscreen_exits > 1 ? 'text-rose-600' : 'text-zinc-700'}>{r.proctoring_summary?.fullscreen_exits || 0}</strong></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedAssessmentResults(null)}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Edit Question in Pool */}
      {editingQuestionIdx !== null && activeQuestionDraft && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h4 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Code className="text-indigo-600" size={18} />
                <span>Edit Question #{editingQuestionIdx + 1}</span>
              </h4>
              <button
                onClick={() => { setEditingQuestionIdx(null); setActiveQuestionDraft(null); }}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs font-semibold">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">Problem Title</label>
                <input
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-800 outline-none focus:border-indigo-500"
                  value={activeQuestionDraft.title}
                  onChange={e => setActiveQuestionDraft({ ...activeQuestionDraft, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">Problem Statement</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 outline-none focus:border-indigo-500"
                  value={activeQuestionDraft.problem_statement}
                  onChange={e => setActiveQuestionDraft({ ...activeQuestionDraft, problem_statement: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">Difficulty</label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 outline-none"
                    value={activeQuestionDraft.difficulty}
                    onChange={e => setActiveQuestionDraft({ ...activeQuestionDraft, difficulty: e.target.value })}
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">Marks</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 outline-none"
                    value={activeQuestionDraft.marks || 50}
                    onChange={e => setActiveQuestionDraft({ ...activeQuestionDraft, marks: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">Constraints</label>
                <input
                  className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 outline-none"
                  value={activeQuestionDraft.constraints || ''}
                  onChange={e => setActiveQuestionDraft({ ...activeQuestionDraft, constraints: e.target.value })}
                />
              </div>

              {/* Test Cases Editor */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500">
                    Test Cases ({activeQuestionDraft.test_cases?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedTc = [...(activeQuestionDraft.test_cases || [])];
                      updatedTc.push({ input_data: '', expected_output: '', is_hidden: false, explanation: '' });
                      setActiveQuestionDraft({ ...activeQuestionDraft, test_cases: updatedTc });
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Test Case
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(activeQuestionDraft.test_cases || []).map((tc: any, tIdx: number) => (
                    <div key={tIdx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                          <input
                            type="checkbox"
                            checked={tc.is_hidden}
                            onChange={e => {
                              const updated = [...activeQuestionDraft.test_cases];
                              updated[tIdx].is_hidden = e.target.checked;
                              setActiveQuestionDraft({ ...activeQuestionDraft, test_cases: updated });
                            }}
                            className="rounded"
                          />
                          <span className={tc.is_hidden ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                            {tc.is_hidden ? '🔒 Hidden Evaluation Case' : '👁️ Visible Sample Case'}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeQuestionDraft.test_cases.filter((_: any, i: number) => i !== tIdx);
                            setActiveQuestionDraft({ ...activeQuestionDraft, test_cases: updated });
                          }}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 block">Input:</span>
                          <textarea
                            rows={2}
                            className="w-full p-1.5 rounded-lg border border-zinc-200 text-xs font-mono"
                            value={tc.input_data}
                            onChange={e => {
                              const updated = [...activeQuestionDraft.test_cases];
                              updated[tIdx].input_data = e.target.value;
                              setActiveQuestionDraft({ ...activeQuestionDraft, test_cases: updated });
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 block">Expected Output:</span>
                          <textarea
                            rows={2}
                            className="w-full p-1.5 rounded-lg border border-zinc-200 text-xs font-mono"
                            value={tc.expected_output}
                            onChange={e => {
                              const updated = [...activeQuestionDraft.test_cases];
                              updated[tIdx].expected_output = e.target.value;
                              setActiveQuestionDraft({ ...activeQuestionDraft, test_cases: updated });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteQuestion(editingQuestionIdx)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs"
              >
                Delete Question
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingQuestionIdx(null); setActiveQuestionDraft(null); }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionDraft}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create 10-Question Assessment */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                  10-Question Pool Creator
                </span>
                <h3 className="text-xl font-black text-zinc-900 mt-1">Create Industry Coding Assessment</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase block mb-1">Assessment Name *</label>
                  <input
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={formDuration}
                    onChange={e => setFormDuration(parseInt(e.target.value) || 60)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-600 uppercase block mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl border border-zinc-300 text-sm font-semibold outline-none focus:border-indigo-500"
                    value={formPassing}
                    onChange={e => setFormPassing(parseInt(e.target.value) || 60)}
                  />
                </div>
              </div>

              {/* 10-Question Pool Interactive Controls */}
              <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" />
                      <span>Question Pool: {formQuestions.length} / 10 Required</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 font-semibold block">
                      Exactly 2 questions from this pool are assigned to each candidate upon starting.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formQuestions.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddNewQuestion}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={13} /> Add Question
                      </button>
                    )}
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                      formQuestions.length === 10
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {formQuestions.length === 10 ? '✓ Ready (10/10)' : `Incomplete (${formQuestions.length}/10)`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {formQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-indigo-100 text-xs flex items-center justify-between hover:border-indigo-300 transition-all group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-zinc-900 truncate">
                          <span className="text-indigo-600 font-black mr-1.5">#{idx + 1}</span>
                          {q.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          {q.difficulty} · {q.marks || 50} Marks · {q.test_cases?.length || 0} Testcases
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditQuestion(idx)}
                          className="px-2 py-1 bg-zinc-100 hover:bg-indigo-50 text-zinc-700 hover:text-indigo-600 rounded-md font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-all cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleCreateAssessment}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Publishing Pool...' : 'Publish Assessment with 10 Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRCodingAssessmentsManager;

'use client';

import { useState, useRef } from 'react';
import { Platform, getPlatformDisplayName } from '@/services/urlParser';
import PlatformBadge from '@/components/PlatformBadge';

interface TranscriptViewerProps {
  transcript: {
    id: string;
    url: string;
    platform: string;
    title?: string | null;
    content: string;
    duration?: number | null;
    createdAt: Date | string;
  };
}

type Tab = 'transcript' | 'summary' | 'content';

interface AISummary {
  summary: string;
  keyPoints: string[];
  topics: string[];
}

interface AIContent {
  blogPost: string | { title?: string; content?: string };
  twitterThread: string[] | { title?: string; content?: string }[];
  linkedInPost: string | { title?: string; content?: string };
  showNotes: string | { title?: string; content?: string };
}

// Helper to extract string content from AI response (handles both string and object formats)
const getContentString = (value: string | { title?: string; content?: string } | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // Handle object with title/content structure
    const parts: string[] = [];
    if (value.title) parts.push(value.title);
    if (value.content) parts.push(value.content);
    return parts.join('\n\n');
  }
  return String(value);
};

const getTweetString = (tweet: string | { title?: string; content?: string }): string => {
  if (typeof tweet === 'string') return tweet;
  if (typeof tweet === 'object') {
    return tweet.content || tweet.title || '';
  }
  return String(tweet);
};

export default function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('transcript');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(transcript.content);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  // AI states
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [aiError, setAiError] = useState('');

  const addTimestampsToContent = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, i) => {
      const seconds = i * 5;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
      return `${timestamp} ${line}`;
    }).join('\n');
  };

  const handleCopy = async (withTimestamps = false) => {
    try {
      let text = isEditing ? editedContent : transcript.content;
      if (withTimestamps) {
        text = addTimestampsToContent(text);
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedLabel(withTimestamps ? 'with timestamps' : '');
      setTimeout(() => {
        setCopied(false);
        setCopiedLabel('');
      }, 2000);
    } catch {
      let text = isEditing ? editedContent : transcript.content;
      if (withTimestamps) {
        text = addTimestampsToContent(text);
      }
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setCopiedLabel(withTimestamps ? 'with timestamps' : '');
      setTimeout(() => {
        setCopied(false);
        setCopiedLabel('');
      }, 2000);
    }
    setShowCopyMenu(false);
  };

  const handleDownload = (format: 'txt' | 'srt' | 'vtt' | 'pdf') => {
    const content = isEditing ? editedContent : transcript.content;

    if (format === 'pdf') {
      handlePdfDownload(content);
      return;
    }

    let fileContent = content;
    let mimeType = 'text/plain';
    const extension = format;

    if (format === 'srt') {
      fileContent = convertToSRT(content);
      mimeType = 'application/x-subrip';
    } else if (format === 'vtt') {
      fileContent = convertToVTT(content);
      mimeType = 'text/vtt';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title || 'transcript'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePdfDownload = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = transcript.title || 'Transcript';
    const formattedContent = showTimestamps ? addTimestampsToContent(content) : content;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1a1a1a;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
              color: #0a0a0a;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 1px solid #eee;
            }
            .content {
              white-space: pre-wrap;
              font-size: 14px;
            }
            .timestamp {
              color: #d97706;
              font-weight: 500;
              font-family: monospace;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <div>Source: ${transcript.url}</div>
            <div>Platform: ${getPlatformDisplayName(transcript.platform as Platform)}</div>
            ${transcript.duration ? `<div>Duration: ${formatDuration(transcript.duration)}</div>` : ''}
          </div>
          <div class="content">${formattedContent.replace(/\[(\d{2}:\d{2})\]/g, '<span class="timestamp">[$1]</span>')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const convertToSRT = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    let srt = '';
    lines.forEach((line, i) => {
      const startTime = formatSRTTime(i * 5);
      const endTime = formatSRTTime((i + 1) * 5);
      srt += `${i + 1}\n${startTime} --> ${endTime}\n${line}\n\n`;
    });
    return srt;
  };

  const convertToVTT = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    let vtt = 'WEBVTT\n\n';
    lines.forEach((line, i) => {
      const startTime = formatVTTTime(i * 5);
      const endTime = formatVTTTime((i + 1) * 5);
      vtt += `${startTime} --> ${endTime}\n${line}\n\n`;
    });
    return vtt;
  };

  const formatSRTTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s},000`;
  };

  const formatVTTTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}.000`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.content.split(/\s+/).filter(Boolean).length;

  const highlightSearch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-[var(--accent)]/30 text-[var(--foreground)] rounded px-0.5">$1</mark>');
  };

  const searchMatchCount = searchQuery.trim()
    ? (transcript.content.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  const generateSummary = async () => {
    setLoadingSummary(true);
    setAiError('');
    try {
      const res = await fetch(`/api/transcript/${transcript.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summary' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data.result);
      setActiveTab('summary');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const generateContentRepurpose = async () => {
    setLoadingContent(true);
    setAiError('');
    try {
      const res = await fetch(`/api/transcript/${transcript.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'content' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiContent(data.result);
      setActiveTab('content');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoadingContent(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-glow rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--card-border)]">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <PlatformBadge platform={transcript.platform} size="sm" />
              {transcript.duration && (
                <span className="text-sm text-[var(--muted)]">
                  {formatDuration(transcript.duration)}
                </span>
              )}
              <span className="text-sm text-[var(--muted)]">
                {wordCount.toLocaleString()} words
              </span>
            </div>
            <h1 className="text-xl font-semibold truncate mb-1">
              {transcript.title || 'Untitled'}
            </h1>
            <a
              href={transcript.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-light)] truncate block"
            >
              {transcript.url}
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          {/* Copy Dropdown */}
          <div className="relative" ref={copyMenuRef}>
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied{copiedLabel ? ` ${copiedLabel}` : ''}!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
            {showCopyMenu && (
              <div className="absolute left-0 mt-2 w-48 rounded-lg bg-[var(--background-secondary)] border border-[var(--input-border)] shadow-lg z-10">
                <button onClick={() => handleCopy(false)} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 rounded-t-lg">
                  Copy text
                </button>
                <button onClick={() => handleCopy(true)} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 rounded-b-lg">
                  Copy with timestamps
                </button>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--input-border)] text-[var(--foreground)] hover:bg-[#292524] transition-colors text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute left-0 mt-2 w-40 rounded-lg bg-[var(--background-secondary)] border border-[var(--input-border)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 rounded-t-lg">
                Download .txt
              </button>
              <button onClick={() => handleDownload('srt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10">
                Download .srt
              </button>
              <button onClick={() => handleDownload('vtt')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10">
                Download .vtt
              </button>
              <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 rounded-b-lg">
                Download .pdf
              </button>
            </div>
          </div>

          {/* Timestamp Toggle */}
          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className={`inline-flex items-center px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
              showTimestamps
                ? 'bg-[var(--accent)] text-[#0c0a09] border-[var(--accent)]'
                : 'bg-[var(--background-secondary)] border-[var(--input-border)] text-[var(--foreground)] hover:bg-[#292524]'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timestamps
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
              isEditing
                ? 'bg-[var(--accent)] text-[#0c0a09] border-[var(--accent)]'
                : 'bg-[var(--background-secondary)] border-[var(--input-border)] text-[var(--foreground)] hover:bg-[#292524]'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isEditing ? 'Editing' : 'Edit'}
          </button>

          <div className="flex-1" />

          {/* AI Buttons */}
          <div className="relative group">
            <button
              onClick={generateSummary}
              disabled={loadingSummary}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loadingSummary ? (
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              AI Summary
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--muted)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-20">
              Generate summary, key points & topics
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={generateContentRepurpose}
              disabled={loadingContent}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loadingContent ? (
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              )}
              Create Content
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--card-border)] rounded-lg text-xs text-[var(--muted)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-20">
              Generate blog post, tweets, LinkedIn & show notes
            </div>
          </div>
        </div>

        {aiError && (
          <div className="mt-4 status-error">{aiError}</div>
        )}

        {/* Search */}
        <div className="mt-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in transcript..."
            className="input-field pl-10 py-2 text-sm"
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
              {searchMatchCount} match{searchMatchCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-[var(--card-border)]">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            disabled={!summary}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
              activeTab === 'summary'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Summary {summary && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('content')}
            disabled={!aiContent}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
              activeTab === 'content'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Content {aiContent && '✓'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'transcript' && (
          isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[600px] bg-[var(--background)] text-[var(--foreground)] p-5 rounded-xl border border-[var(--card-border)] focus:border-[var(--accent)] focus:outline-none resize-none font-sans text-base leading-relaxed"
            />
          ) : (
            <pre
              className="whitespace-pre-wrap font-sans text-[var(--foreground)] text-base leading-relaxed bg-[var(--background)] p-5 rounded-xl overflow-auto max-h-[600px] border border-[var(--card-border)]"
              dangerouslySetInnerHTML={{
                __html: highlightSearch(
                  showTimestamps ? addTimestampsToContent(transcript.content) : transcript.content
                ).replace(
                  /\[(\d{2}:\d{2})\]/g,
                  '<span class="text-[var(--accent)] font-mono text-sm mr-2">[$1]</span>'
                )
              }}
            />
          )
        )}

        {activeTab === 'summary' && summary && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <p className="text-[var(--foreground)] leading-relaxed bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
                {summary.summary}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Points</h3>
              <ul className="space-y-2 bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {summary.topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && aiContent && (
          <div className="space-y-6">
            {/* Blog Post */}
            {aiContent.blogPost && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Blog Post
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getContentString(aiContent.blogPost))}
                    className="text-xs px-3 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">Ready-to-publish blog post based on your transcript</p>
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] max-h-64 overflow-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{getContentString(aiContent.blogPost)}</pre>
                </div>
              </div>
            )}

            {/* Twitter/X Thread */}
            {aiContent.twitterThread && Array.isArray(aiContent.twitterThread) && aiContent.twitterThread.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X/Twitter Thread
                  </h3>
                  <button
                    onClick={() => copyToClipboard(aiContent.twitterThread.map(getTweetString).join('\n\n'))}
                    className="text-xs px-3 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    Copy All
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">Thread-ready tweets to share your content</p>
                <div className="space-y-2">
                  {aiContent.twitterThread.map((tweet, i) => (
                    <div key={i} className="bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)] text-sm">
                      <span className="text-[var(--muted)] text-xs">Tweet {i + 1}</span>
                      <p className="mt-1">{getTweetString(tweet)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LinkedIn Post */}
            {aiContent.linkedInPost && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn Post
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getContentString(aiContent.linkedInPost))}
                    className="text-xs px-3 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">Professional post for your LinkedIn audience</p>
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{getContentString(aiContent.linkedInPost)}</pre>
                </div>
              </div>
            )}

            {/* Show Notes */}
            {aiContent.showNotes && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Show Notes
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getContentString(aiContent.showNotes))}
                    className="text-xs px-3 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">Episode notes with key points and timestamps</p>
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)]">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{getContentString(aiContent.showNotes)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

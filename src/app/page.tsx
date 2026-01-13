'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import URLForm from '@/components/URLForm';

// Platform icons as SVG components
const PlatformIcons = {
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.858-.712 2.048-1.138 3.447-1.23.926-.062 1.83.02 2.688.244-.087-.715-.264-1.269-.535-1.66-.376-.543-.993-.82-1.836-.82h-.094c-.706.017-1.282.205-1.714.562-.432.357-.663.848-.688 1.463l-2.065-.07c.052-1.181.533-2.143 1.43-2.862 1-.803 2.33-1.197 3.96-1.174h.093c1.59.017 2.861.542 3.78 1.562.876.974 1.33 2.324 1.353 4.014v.158c.048.157.076.32.076.49 0 .063-.003.125-.008.187.293.18.568.387.822.624 1.168 1.098 1.822 2.652 1.846 4.38.028 1.99-.705 3.724-2.062 4.88C18.015 23.198 15.499 24 12.186 24zm-.09-5.732c1.044-.06 1.835-.424 2.354-1.084.518-.66.832-1.593.937-2.78-.613-.128-1.27-.186-1.958-.171-1.478.029-2.58.404-3.097.959-.398.427-.581.96-.545 1.586.037.67.346 1.178.894 1.467.525.276 1.163.39 1.898.39l.517-.367z"/>
    </svg>
  ),
  bluesky: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  vimeo: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  snapchat: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.603.603 0 0 1 .272-.063c.12 0 .24.03.345.09.299.168.465.465.465.766 0 .5-.45.888-1.333 1.149-.24.075-.479.12-.689.165-.57.12-.91.194-1.078.586-.09.21-.09.405-.045.66.015.12.045.226.075.33.36 1.53 1.542 3.18 3.239 3.629.585.165.795.525.705.885-.105.3-.479.555-1.108.66-1.29.24-2.13.345-2.685 1.035-.09.135-.179.27-.284.405-.195.24-.465.615-1.605.615-.24 0-.525-.03-.84-.075-.48-.075-.84-.165-1.095-.225-.255-.045-.495-.075-.735-.075-.2 0-.4.015-.6.06-.3.06-.675.165-1.215.285-.375.075-.72.135-1.035.135-.69 0-1.035-.315-1.17-.465a1.95 1.95 0 0 1-.215-.27c-.615-.69-1.395-.795-2.685-1.035-.63-.105-1.005-.36-1.11-.66-.075-.36.12-.72.705-.885 1.695-.45 2.88-2.1 3.24-3.63.03-.105.06-.225.075-.33.045-.255.045-.449-.045-.66-.168-.39-.51-.465-1.08-.585a5.1 5.1 0 0 1-.69-.165c-.585-.165-1.17-.45-1.245-.87-.03-.18.015-.36.105-.51.075-.165.21-.3.38-.405a.893.893 0 0 1 .5-.135c.12 0 .24.015.36.045.329.09.66.195 1.02.3.195.06.36.09.495.09.105 0 .195-.03.285-.075a1.49 1.49 0 0 1-.03-.51l-.003-.06c-.105-1.628-.232-3.654.298-4.847C7.86 1.068 11.216.793 12.206.793"/>
    </svg>
  ),
  rumble: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16.002 19.224c.24.24.36.48.36.72 0 .48-.24.84-.6 1.08-.24.12-.48.24-.84.24h-4.68c-.36 0-.6-.12-.84-.24-.36-.24-.6-.6-.6-1.08 0-.24.12-.48.36-.72l2.04-2.04c.36-.36.84-.36 1.2 0l2.4 2.04zm5.998-8.4c0 2.16-.96 4.08-2.52 5.4l-2.76 2.76c-.24.24-.48.36-.72.36-.24 0-.48-.12-.72-.36l-2.76-2.76c-.24-.24-.36-.48-.36-.72 0-.24.12-.48.36-.72l2.76-2.76c1.32-1.32 2.04-3.12 2.04-4.92 0-3.84-3.12-7.08-7.08-7.08S2.16 3.24 2.16 7.08c0 1.8.72 3.6 2.04 4.92l2.76 2.76c.24.24.36.48.36.72 0 .24-.12.48-.36.72l-2.76 2.76c-.24.24-.48.36-.72.36-.24 0-.48-.12-.72-.36l-2.76-2.76C-.48 14.64-1.44 12.72-1.44 10.56c0-6.6 5.4-12 12-12s12 5.4 12 12c0 1.08-.12 2.04-.36 2.88-.12.36-.12.6-.12.84 0 .24.12.48.36.72l.36.36"/>
    </svg>
  ),
  dailymotion: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.986 17.113v-.12c-.546-.053-1.08-.227-1.553-.5a3.89 3.89 0 0 1-1.253-1.107 5.29 5.29 0 0 1-.827-1.66 6.917 6.917 0 0 1-.293-2.047c0-.733.1-1.407.3-2.02.2-.614.487-1.14.86-1.58a3.91 3.91 0 0 1 1.347-1.027c.526-.247 1.12-.373 1.78-.373.666 0 1.26.133 1.78.4.52.267.96.627 1.32 1.08.36.454.633.98.82 1.58.187.6.28 1.234.28 1.9 0 .76-.107 1.447-.32 2.06a4.62 4.62 0 0 1-.893 1.607 4.03 4.03 0 0 1-1.374 1.04c-.533.247-1.126.374-1.78.374-.28 0-.52-.02-.72-.054l-.454-.053zm2.887 3.86c1.213-.427 2.26-1.067 3.14-1.92.88-.854 1.567-1.88 2.06-3.08.494-1.2.74-2.527.74-3.98 0-1.4-.22-2.66-.66-3.78-.44-1.12-1.06-2.073-1.86-2.86-.8-.787-1.76-1.393-2.88-1.82-1.12-.426-2.353-.64-3.7-.64-1.293 0-2.493.227-3.6.68-1.106.453-2.073 1.087-2.9 1.9-.826.813-1.473 1.787-1.94 2.92-.466 1.134-.7 2.387-.7 3.76 0 1.36.234 2.6.7 3.72.467 1.12 1.114 2.087 1.94 2.9.827.813 1.8 1.44 2.92 1.88 1.12.44 2.334.66 3.64.66V24l4.1-3.027z"/>
    </svg>
  ),
  podcast: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm3.6 17.472c-.084.084-.192.144-.312.18-.048.012-.096.024-.144.024-.18 0-.348-.072-.48-.204l-2.664-2.664-2.664 2.664c-.132.132-.3.204-.48.204-.048 0-.096-.012-.144-.024-.12-.036-.228-.096-.312-.18-.168-.168-.228-.408-.168-.636l.9-3.6-2.664-1.92c-.156-.12-.252-.3-.252-.492 0-.168.072-.336.192-.456.12-.12.276-.192.444-.204l3.108-.312.9-3.012c.06-.192.192-.348.372-.432.18-.084.384-.084.564 0 .18.084.312.24.372.432l.9 3.012 3.108.312c.168.012.324.084.444.204.12.12.192.288.192.456 0 .192-.096.372-.252.492l-2.664 1.92.9 3.6c.06.228 0 .468-.168.636z"/>
    </svg>
  ),
};

interface Platform {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const platforms: Platform[] = [
  { name: 'YouTube', icon: PlatformIcons.youtube, color: 'text-red-400' },
  { name: 'TikTok', icon: PlatformIcons.tiktok, color: 'text-neutral-300' },
  { name: 'Instagram', icon: PlatformIcons.instagram, color: 'text-pink-400' },
  { name: 'X', icon: PlatformIcons.twitter, color: 'text-neutral-300' },
  { name: 'Threads', icon: PlatformIcons.threads, color: 'text-neutral-300' },
  { name: 'Bluesky', icon: PlatformIcons.bluesky, color: 'text-sky-400' },
  { name: 'Facebook', icon: PlatformIcons.facebook, color: 'text-blue-400' },
  { name: 'Vimeo', icon: PlatformIcons.vimeo, color: 'text-cyan-400' },
  { name: 'Twitch', icon: PlatformIcons.twitch, color: 'text-purple-400' },
  { name: 'Reddit', icon: PlatformIcons.reddit, color: 'text-orange-400' },
  { name: 'LinkedIn', icon: PlatformIcons.linkedin, color: 'text-blue-400' },
  { name: 'Snapchat', icon: PlatformIcons.snapchat, color: 'text-yellow-400' },
  { name: 'Rumble', icon: PlatformIcons.rumble, color: 'text-green-400' },
  { name: 'Dailymotion', icon: PlatformIcons.dailymotion, color: 'text-blue-400' },
  { name: 'Podcasts', icon: PlatformIcons.podcast, color: 'text-purple-400' },
];

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col grain">
      {/* Ambient background */}
      <div className="ambient-glow" />

      {/* Hero Section */}
      <section className="flex-1 flex items-center py-24 px-4">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Editorial typography */}
            <div className="opacity-0 animate-slideUp">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--card-border)] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                  AI-Powered
                </span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight mb-6 leading-[1.05]">
                Extract words
                <br />
                from <span className="gradient-text italic">any</span> media
              </h1>

              <p className="text-lg text-[var(--foreground-muted)] mb-8 max-w-md leading-relaxed">
                Paste a URL. Get a transcript. It works with YouTube, TikTok, Instagram,
                X, podcasts, and 10+ other platforms.
              </p>

              {/* Stats row */}
              <div className="flex gap-8 mb-8 font-mono text-sm">
                <div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">15+</div>
                  <div className="text-[var(--muted)] uppercase tracking-wider text-xs">Platforms</div>
                </div>
                <div className="w-px bg-[var(--card-border)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">Free</div>
                  <div className="text-[var(--muted)] uppercase tracking-wider text-xs">Captions</div>
                </div>
                <div className="w-px bg-[var(--card-border)]" />
                <div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">AI</div>
                  <div className="text-[var(--muted)] uppercase tracking-wider text-xs">Fallback</div>
                </div>
              </div>

              {!session && status !== 'loading' && (
                <div className="flex gap-3">
                  <Link href="/auth/register" className="btn-primary">
                    Get Started
                  </Link>
                  <Link href="/auth/login" className="btn-secondary">
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Right side - Form or CTA */}
            <div className="opacity-0 animate-slideUp delay-2">
              {status === 'loading' ? (
                <div className="flex justify-center py-20">
                  <div className="spinner" />
                </div>
              ) : session ? (
                <div className="film-card p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl mb-1">New Transcript</h2>
                    <p className="text-sm text-[var(--muted)]">Paste any media URL below</p>
                  </div>
                  <URLForm />
                </div>
              ) : (
                <div className="relative">
                  {/* Decorative film strip pattern */}
                  <div className="absolute -left-4 top-0 bottom-0 w-8 flex flex-col justify-between py-4 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-full h-4 bg-[var(--foreground)] rounded-sm" />
                    ))}
                  </div>

                  <div className="film-card p-8 ml-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--accent-glow)] flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <h2 className="font-display text-2xl mb-2">Start Transcribing</h2>
                      <p className="text-[var(--muted)] text-sm mb-8 max-w-xs mx-auto">
                        Create an account to save transcripts and access AI features.
                      </p>
                      <div className="space-y-3">
                        <Link href="/auth/register" className="btn-primary block w-full text-center">
                          Create Free Account
                        </Link>
                        <Link href="/auth/login" className="btn-ghost block w-full text-center">
                          Already have an account?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform ticker */}
      <section className="py-12 border-t border-[var(--card-border)] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-8">
            Works with 15+ platforms
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className={`inline-flex items-center gap-2 text-sm ${p.color} opacity-60 hover:opacity-100 transition-opacity`}
              >
                {p.icon}
                <span className="font-mono text-xs">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 border-t border-[var(--card-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Three steps. <span className="italic text-[var(--accent)]">That&apos;s it.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Paste URL',
                desc: 'Copy a link from any supported platform and drop it in.',
              },
              {
                num: '02',
                title: 'We Extract',
                desc: 'We grab existing captions for free, or generate with Whisper AI.',
              },
              {
                num: '03',
                title: 'Get Text',
                desc: 'View, edit, search, copy, or export your transcript instantly.',
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`step-card opacity-0 animate-slideUp`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="font-mono text-[var(--accent)] text-sm mb-4 tracking-wider">
                  {step.num}
                </div>
                <h3 className="font-display text-xl mb-3">
                  {step.title}
                </h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-[var(--card-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl mb-6">
                Beyond just <br/>
                <span className="italic text-[var(--accent)]">transcription</span>
              </h2>
              <p className="text-[var(--muted)] leading-relaxed mb-8">
                Use AI to summarize, repurpose, and transform your content.
                Turn videos into blog posts, social threads, and show notes with one click.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: 'AI Summary',
                  desc: 'Key points extracted automatically',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  )
                },
                {
                  title: 'Blog Posts',
                  desc: 'Ready-to-publish articles',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  )
                },
                {
                  title: 'Social Posts',
                  desc: 'Twitter, LinkedIn threads',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  )
                },
                {
                  title: 'Export',
                  desc: 'TXT, SRT, VTT, PDF',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  )
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="card p-5 opacity-0 animate-slideUp"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent)] mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-[var(--muted)]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[var(--card-border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-mono text-xs text-[var(--muted)]">
            TranscriptApp
          </div>
          <div className="font-mono text-xs text-[var(--muted)]">
            Powered by AI
          </div>
        </div>
      </footer>
    </div>
  );
}

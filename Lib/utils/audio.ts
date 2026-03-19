'use client';

let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;

export async function initializeAudio(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (!notificationBuffer) {
    try {
      // Try to load notification sound
      const response = await fetch('/sounds/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Failed to load notification sound:', error);
      // Will fall back to visual notification
    }
  }
}

export async function playNotificationSound(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Initialize audio if not ready
    if (!audioContext || !notificationBuffer) {
      await initializeAudio();
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create and play sound
    if (audioContext && notificationBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = notificationBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else {
      // Fallback to visual notification
      showVisualNotification('Pomodoro Complete!');
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    // Fallback: show visual notification
    showVisualNotification('Pomodoro Complete!');
  }
}

export function showVisualNotification(message: string): void {
  if (typeof window === 'undefined') return;

  // Create toast notification element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: var(--accent);
    color: #1a1612;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    font-weight: bold;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation keyframes
  if (!document.getElementById('toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

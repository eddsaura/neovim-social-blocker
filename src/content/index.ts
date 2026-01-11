// Content script - runs on Twitter/X pages
// Embeds the Neovim challenge directly on the page

interface UnlockState {
  isUnlocked: boolean;
  expiresAt: number | null;
}

let overlayElement: HTMLDivElement | null = null;
let challengeIframe: HTMLIFrameElement | null = null;

async function checkAndBlock() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_UNLOCK_STATE' });
    const state = response as UnlockState;

    if (!state.isUnlocked) {
      showChallenge();
    } else if (state.expiresAt && Date.now() > state.expiresAt) {
      // Unlock expired
      await chrome.runtime.sendMessage({ type: 'LOCK_TWITTER' });
      showChallenge();
    } else {
      hideChallenge();
    }
  } catch (error) {
    console.error('Block Twitter: Error checking unlock state', error);
    showChallenge(); // Block by default if there's an error
  }
}

function showChallenge() {
  if (overlayElement) return; // Already showing

  // Hide page content immediately and prevent scrolling
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Create overlay container
  overlayElement = document.createElement('div');
  overlayElement.id = 'nvim-challenge-overlay';
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483647;
    background: #1a1b26;
  `;

  // Create iframe that loads the challenge page
  challengeIframe = document.createElement('iframe');
  challengeIframe.src = chrome.runtime.getURL('src/challenge/page.html');
  challengeIframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: #1a1b26;
  `;
  challengeIframe.allow = 'clipboard-write';

  overlayElement.appendChild(challengeIframe);
  document.body.appendChild(overlayElement);

  // Listen for success message from iframe
  window.addEventListener('message', handleChallengeMessage);
}

function handleChallengeMessage(event: MessageEvent) {
  // Verify origin is from our extension
  if (event.data?.type === 'CHALLENGE_COMPLETE') {
    hideChallenge();
    // Reload the page to show Twitter
    window.location.reload();
  }
}

function hideChallenge() {
  window.removeEventListener('message', handleChallengeMessage);

  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
    challengeIframe = null;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}

// Check immediately on page load
checkAndBlock();

// Also check when page becomes visible (tab switch)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkAndBlock();
  }
});

// Listen for unlock messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UNLOCKED') {
    hideChallenge();
    window.location.reload();
  } else if (message.type === 'LOCKED') {
    showChallenge();
  }
});

// Export for TypeScript
export {};

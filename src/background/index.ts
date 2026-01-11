import { getUnlockState, checkUnlockExpiry, lockTwitter } from '@/storage';

// Message types
interface Message {
  type: string;
  payload?: unknown;
}

// Check unlock status on startup
chrome.runtime.onStartup.addListener(async () => {
  await checkUnlockExpiry();
});

// Check unlock status when extension is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
  await checkUnlockExpiry();

  // Set up alarm to periodically check unlock expiry
  chrome.alarms.create('checkUnlockExpiry', {
    periodInMinutes: 1,
  });
});

// Handle alarm for checking unlock expiry
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkUnlockExpiry') {
    await checkUnlockExpiry();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep the message channel open for async response
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'GET_UNLOCK_STATE':
      return await getUnlockState();

    case 'CHECK_UNLOCK':
      return await checkUnlockExpiry();

    case 'LOCK_TWITTER':
      return await lockTwitter();

    case 'OPEN_CHALLENGE': {
      const challengeUrl = chrome.runtime.getURL('src/challenge/page.html');
      await chrome.tabs.create({ url: challengeUrl });
      return { success: true };
    }

    case 'OPEN_BUILDER': {
      const builderUrl = chrome.runtime.getURL('src/builder/page.html');
      await chrome.tabs.create({ url: builderUrl });
      return { success: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// Export for TypeScript
export {};

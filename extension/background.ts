// StratWrite extension — background service worker.
// Runs the shared checking engine so the heavy dictionary loads once here
// (not on every page). Content scripts send text; we return suggestions.
import { checkText } from '../src/lib/checker'
import { loadDictionary } from '../src/lib/spell'

declare const chrome: any

// Warm up the dictionary as soon as the worker starts.
loadDictionary()

chrome.runtime.onMessage.addListener((msg: any, _sender: any, sendResponse: any) => {
  if (msg && msg.type === 'sw-check') {
    loadDictionary()
      .then(() => {
        const result = checkText(String(msg.text || ''))
        sendResponse({ ok: true, suggestions: result.suggestions, score: result.score })
      })
      .catch((e) => sendResponse({ ok: false, error: String(e) }))
    return true // keep the message channel open for the async response
  }
  return false
})

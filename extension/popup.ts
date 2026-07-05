declare const chrome: any

const toggle = document.getElementById('toggle') as HTMLInputElement

chrome.storage.local.get({ enabled: true }, (r: any) => {
  toggle.checked = r?.enabled !== false
})

toggle.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: toggle.checked })
})

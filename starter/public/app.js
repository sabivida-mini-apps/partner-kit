// Starter partner app: trade the launch token for a session on your own server,
// then use SabiVida features the host says it supports.
const status = document.getElementById('status');
const add = document.getElementById('add');
const result = document.getElementById('result');

async function start() {
  try {
    const { token } = await window.SabiVida.ready();
    const response = await fetch('/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error('session');
    const member = await response.json();
    status.textContent = `Signed in as ${member.name ?? 'a SabiVida member'}`;
    add.hidden = !window.SabiVida.supports('add_task');
  } catch (error) {
    status.textContent = `SabiVida sign-in failed (${error.message}).`;
  }
}

add.addEventListener('click', async () => {
  const outcome = await window.SabiVida.addTask({
    title: 'Renew passport at the consulate',
    dueDate: '2026-12-01',
  });
  result.textContent = `Step ${outcome}`;
});

start();

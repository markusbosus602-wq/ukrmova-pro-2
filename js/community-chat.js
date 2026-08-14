let communityChatBound = false;

function loadCommunityChat() {
  if (!user || !user.uid || communityChatBound) return;
  const container = document.getElementById('communityMessages');
  if (!container) return;
  communityChatBound = true;
  rtdb.ref('communityChat').limitToLast(60).on('value', snapshot => {
    const entries = snapshot.val() || {};
    const messages = Object.entries(entries).map(([id, value]) => ({ id, ...value })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (!messages.length) { container.textContent = 'У спільноті ще немає повідомлень. Напишіть першим!'; return; }
    container.innerHTML = messages.map(message => {
      const own = message.uid === user.uid;
      const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '';
      return `<div class="community-message ${own ? 'own' : ''}"><div><b>${escapeHtml(message.nick || 'Гравець')}</b><time>${time}</time></div><p>${escapeHtml(message.text || '')}</p></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }, error => { console.error(error); container.textContent = 'Не вдалося завантажити чат.'; });
}

async function sendCommunityMessage() {
  if (!user || !user.uid) return;
  const input = document.getElementById('communityMessageInput');
  const text = input.value.trim();
  if (!text) return;
  try {
    await rtdb.ref('communityChat').push({ uid: user.uid, nick: user.name || 'Гравець', text: text.slice(0, 280), timestamp: firebase.database.ServerValue.TIMESTAMP });
    input.value = '';
  } catch (error) {
    console.error(error);
    showNotification('Не вдалося надіслати повідомлення.', true);
  }
}

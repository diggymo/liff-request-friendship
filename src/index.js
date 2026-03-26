import './index.css';
import liff from '@line/liff';

const $ = (id) => document.getElementById(id);

function addLog(message, isError = false) {
  const log = $('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (isError ? ' error' : '');
  const time = new Date().toLocaleTimeString('ja-JP');
  entry.innerHTML = `<span class="time">${time}</span>${message}`;
  log.prepend(entry);
}

function setBadge(id, text, color) {
  const el = $(id);
  el.textContent = text;
  el.className = `badge badge--${color}`;
}

async function checkFriendship() {
  try {
    addLog('getFriendship() を呼び出し中...');
    const { friendFlag } = await liff.getFriendship();
    if (friendFlag) {
      setBadge('friendship-status', '友だち', 'green');
      addLog('友だち状態: 友だちです ✓');
    } else {
      setBadge('friendship-status', '非友だち', 'red');
      addLog('友だち状態: 友だちではありません');
    }
  } catch (error) {
    addLog(`getFriendship() エラー: ${error.message || error}`, true);
  }
}

async function requestFriendship() {
  try {
    addLog('requestFriendship() を呼び出し中...');
    await liff.requestFriendship();
    addLog('requestFriendship() 完了 - サブウィンドウが閉じられました');
    addLog('友だち状態を再確認します...');
    await checkFriendship();
  } catch (error) {
    const code = error.code || '';
    if (code === 'FORBIDDEN') {
      addLog(
        'FORBIDDEN: 画面サイズがFull以外、またはLINE公式アカウントが未設定です',
        true
      );
    } else {
      addLog(`requestFriendship() エラー: ${code} ${error.message || error}`, true);
    }
  }
}

async function initializeLiff() {
  try {
    addLog('LIFF 初期化中...');
    await liff.init({ liffId: process.env.LIFF_ID });
    setBadge('liff-status', '初期化済み', 'green');
    addLog(`LIFF 初期化成功 (SDK ${liff.getVersion ? liff.getVersion() : ''})`);

    if (!liff.isInClient()) {
      $('warning').style.display = 'block';
      addLog('外部ブラウザで実行中です');
    }

    if (!liff.isLoggedIn()) {
      setBadge('login-status', '未ログイン', 'red');
      addLog('未ログイン - ログインを開始します');
      liff.login();
      return;
    }

    setBadge('login-status', 'ログイン済み', 'green');
    addLog('ログイン済み');

    $('btn-check-friendship').disabled = false;
    if (liff.isInClient()) {
      $('btn-request-friendship').disabled = false;
    }

    await checkFriendship();
  } catch (error) {
    setBadge('liff-status', 'エラー', 'red');
    addLog(`LIFF 初期化エラー: ${error.message || error}`, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('btn-check-friendship').addEventListener('click', checkFriendship);
  $('btn-request-friendship').addEventListener('click', requestFriendship);
  initializeLiff();
});

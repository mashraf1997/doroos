// Turns what a teacher pastes (a YouTube, Vimeo, Bunny or Google Drive link, or an uploaded file) into something to play.

export function videoSource(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  if (/^file:[\w.-]+$/.test(v)) return { type: 'file', name: v.slice(5) };
  let u;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let m;
  if (host === 'youtu.be') return yt(u.pathname.slice(1));
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.searchParams.get('v')) return yt(u.searchParams.get('v'));
    if ((m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/))) return yt(m[2]);
  }
  if (host === 'vimeo.com' && (m = u.pathname.match(/^\/(\d+)(?:\/(\w+))?/))) return { type: 'embed', src: `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}` };
  if (host === 'player.vimeo.com') return { type: 'embed', src: u.href };
  if (/(^|\.)mediadelivery\.net$/.test(host) || (/(^|\.)b-cdn\.net$/.test(host) && /\/embed\//.test(u.pathname))) return { type: 'embed', src: u.href };
  if (host === 'drive.google.com' && (m = u.pathname.match(/\/file\/d\/([\w-]+)/))) return { type: 'embed', src: `https://drive.google.com/file/d/${m[1]}/preview` };
  if (/\.(mp4|webm|m3u8)$/i.test(u.pathname)) return { type: 'url', src: u.href };
  return null;
}

function yt(id) {
  return /^[\w-]{6,20}$/.test(id) ? { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` } : null;
}

/* Winning Streak video loader (18 Nov 2026): Vidonomics on every page, Vidalytics as the fallback.

   Each video spot on a page is a <div data-ws-video="<Vidalytics embed id>">. This file swaps it
   for that video's Vidonomics twin (VX below). Vidonomics then decides per visitor, from each
   video's own dashboard settings:
     - rollout %   share of visitors who get Vidonomics; the rest get the Vidalytics embed
     - kill switch everyone back on Vidalytics, instantly, no site change
   Failsafe: any spot Vidonomics hasn't filled within 8s (script blocked or down, video not
   published, network error) gets its original Vidalytics embed, exactly as before this change.
   QA: ?vsl_force=new forces Vidonomics, ?vsl_force=old forces the Vidalytics fallback.

   The homepage hero is a special case kept from the 13 Nov test: on "/" it uses the homepage-only
   copies (Vidalytics NczvERplPrJObEGH / Vidonomics WS-VSL-3) so homepage stats stay apart from
   /ads /free /cold, which share the main VSL with /go. */
(function () {
  var VX = {
    // Vidalytics embed id   : Vidonomics video id
    'jkiol1FheozZ11he': 'v_cbk87ojp324b',       // main VSL "VSL 3 done": /go, /go50, /ads, /free, /cold
    'NczvERplPrJObEGH': 'v_c16527ti0nkf',       // homepage-only copy (WS-VSL-3): "/" hero
    'N5IvZSsvawgrOW37': 'v_umiamo3p10on',       // thank-you pages: post-signup VSL
    'mdR2zIx711Fpu2hM': 'v_ychixup3lxbo',       // 1 Finn
    'koaL6fxLhyl1kQeS': 'v_57zt5oy4t9jv',       // 2 Kyan
    'trcoeWifaraTa2hQ': 'v_sq5gfg3ad2u1',       // 3 Hogan
    '4CTERLmU7kclipCW': 'v_xgdjo3mubaxe',       // 4 Archie
    '12BbHGRWdWBXfH40': 'v_7h8l61h4vv43'        // 5 Seb
  };
  // Full-screen fixes for the Vidonomics player on phones (24 Nov 2026).
  // 1. The player leaves its thumbnail layer zoomed to fill the tall screen, so a cropped copy
  //    of the picture showed above and below the real video. Hide the thumbnail in full screen.
  // 2. On /go-v4 the video sits inside an animated, clipped frame. That pinned the full-screen
  //    player to the frame, not the screen, so it opened out of view. While full screen is
  //    open, switch those effects off on the boxes around the player. They come back on close.
  (function () {
    var css = document.createElement('style');
    css.textContent =
      '.vsl.vsl-focus{margin:0!important;border:0!important;max-width:none!important;border-radius:0!important;background:#000!important}' +
      '.vsl.vsl-focus .vsl-poster{background-image:none!important;background-color:#000!important}' +
      '.vsl.vsl-focus video{object-fit:contain!important}' +
      '*:has(.vsl-focus){transform:none!important;animation:none!important;filter:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;perspective:none!important;clip-path:none!important;contain:none!important;will-change:auto!important}';
    document.head.appendChild(css);
  })();

  var ACCOUNT = 'jV0yyyR6';
  var path = location.pathname.replace(/\/+$/, '');
  var isHome = path === '' || path === '/index.html';

  function spots() { return Array.prototype.slice.call(document.querySelectorAll('[data-ws-video]')); }
  function embedFor(el) {
    var home = el.getAttribute('data-ws-video-home');
    return isHome && home ? home : el.getAttribute('data-ws-video');
  }

  // The original Vidalytics embed code, mounted into one spot.
  function vidalytics(el, embed) {
    var d = document.createElement('div');
    d.id = 'vidalytics_embed_' + embed;
    if (el.getAttribute('data-ws-pad')) d.style.cssText = 'width:100%;position:relative;padding-top:' + el.getAttribute('data-ws-pad') + ';';
    el.innerHTML = '';
    el.removeAttribute('data-vsl');
    el.classList.remove('vsl');
    el.style.aspectRatio = '';            // the padded Vidalytics div sizes itself
    el.style.background = '';
    el.appendChild(d);
    (function (v, i, d, a, l, y, t, c, s) {
        y='_'+d.toLowerCase();c=d+'L';if(!v[d]){v[d]={};}if(!v[c]){v[c]={};}if(!v[y]){v[y]={};}var vl='Loader',vli=v[y][vl],vsl=v[c][vl + 'Script'],vlf=v[c][vl + 'Loaded'],ve='Embed';
        if (!vsl){vsl=function(u,cb){
            if(t){cb();return;}s=i.createElement("script");s.type="text/javascript";s.async=1;s.src=u;
            if(s.readyState){s.onreadystatechange=function(){if(s.readyState==="loaded"||s.readyState=="complete"){s.onreadystatechange=null;vlf=1;cb();}};}else{s.onload=function(){vlf=1;cb();};}
            i.getElementsByTagName("head")[0].appendChild(s);
        };}
        vsl(l+'loader.min.js',function(){if(!vli){var vlc=v[c][vl];vli=new vlc();}vli.loadScript(l+'player.min.js',function(){var vec=v[d][ve];t=new vec();t.run(a);});});
    })(window, document, 'Vidalytics', 'vidalytics_embed_' + embed, 'https://fast.vidalytics.com/embeds/' + ACCOUNT + '/' + embed + '/');
  }

  // Which Vidalytics embed and which Vidonomics video this page's MAIN video uses, for the
  // page's own watch tracking (Meta milestones). Set before any player starts.
  var main = document.querySelector('[data-ws-video][data-ws-main]');
  window.wsVideoMain = main ? { embed: embedFor(main), vx: VX[embedFor(main)] || null } : null;

  // A spot is fine once Vidonomics has loaded its video (data-src is set only after the video's
  // settings arrive) or mounted the Vidalytics fallback it chose for this visitor. Anything still empty (script blocked, video
  // unpublished, network error) gets its original Vidalytics embed. Checked per spot, not per page.
  function mounted(el) {
    return el.hasAttribute('data-src') || !!el.querySelector('video, [id^="vidalytics_embed_"]') || !el.hasAttribute('data-vsl');
  }
  function rescueEmpty() {
    spots().forEach(function (el) { if (!mounted(el)) vidalytics(el, embedFor(el)); });
  }

  spots().forEach(function (el) {
    var vx = VX[embedFor(el)];
    if (vx) el.setAttribute('data-vsl', vx);
    else vidalytics(el, embedFor(el));      // no Vidonomics twin: stays on Vidalytics
  });

  setTimeout(rescueEmpty, 8000);
  var s = document.createElement('script');
  s.src = 'https://app.vidonomics.com/dist/vsl-player.js';
  s.async = true;
  s.setAttribute('data-collect', 'https://app.vidonomics.com/collect');
  s.setAttribute('data-site', 'ws_heslvlp8eee8aiv9');
  s.onerror = rescueEmpty;
  document.head.appendChild(s);
})();

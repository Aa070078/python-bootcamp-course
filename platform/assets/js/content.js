var CONTENT = (function () {
  var raw = { sessions: {} };
  var ready = fetch('assets/data/content.json?t=' + Date.now())
    .then(function (r) { return r.ok ? r.json() : {}; })
    .catch(function () { return {}; })
    .then(function (json) {
      if (json && typeof json === 'object') {
        raw = json;
        if (!raw.sessions || typeof raw.sessions !== 'object') raw.sessions = {};
      }
      return CONTENT;
    });

  function getOverride(num) {
    return raw.sessions[String(num)] || null;
  }

  function mergeInto(num, obj) {
    var o = getOverride(num);
    if (!o) return obj;
    ['title', 'duration', 'difficulty', 'project', 'homework', 'videoUrl'].forEach(function (k) {
      if (typeof o[k] === 'string' && o[k] !== '') obj[k] = o[k];
    });
    if (typeof o.hasVideo === 'boolean') obj.hasVideo = o.hasVideo;
    if (typeof o.hasMaterial === 'boolean') obj.hasMaterial = o.hasMaterial;
    if (Array.isArray(o.topics) && o.topics.length) obj.topics = o.topics;
    if (typeof o.status === 'string' && o.status) obj.status = o.status;
    return obj;
  }

  function ghConfig() {
    try { return JSON.parse(localStorage.getItem('bootcamp_gh_sync') || '{}'); } catch (e) { return {}; }
  }

  function ghSaveConfig(cfg) {
    localStorage.setItem('bootcamp_gh_sync', JSON.stringify(cfg || {}));
  }

  function guessRepo() {
    var cfg = ghConfig();
    if (cfg.owner && cfg.repo) {
      return { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch || 'gh-pages', token: cfg.token || '' };
    }
    var owner = '', repo = '';
    var h = location.hostname;
    if (h.indexOf('.github.io') > -1) {
      owner = h.split('.')[0];
      var seg = location.pathname.split('/').filter(Boolean);
      if (seg.length) repo = seg[0];
    }
    return { owner: owner, repo: repo, branch: cfg.branch || 'gh-pages', token: cfg.token || '' };
  }

  function ghHeaders() {
    var cfg = ghConfig();
    return {
      'Authorization': 'Bearer ' + (cfg.token || ''),
      'Accept': 'application/vnd.github+json'
    };
  }

  function ghApiBase() {
    var cfg = ghConfig();
    return 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/';
  }

  function ghTest() {
    var cfg = ghConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      return Promise.reject(new Error('Missing owner/repo/token'));
    }
    return fetch('https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo, { headers: ghHeaders() })
      .then(function (r) {
        if (r.status === 200) return true;
        if (r.status === 401) throw new Error('Invalid token (401)');
        if (r.status === 404) throw new Error('Repo not found or token has no access (404)');
        throw new Error('HTTP ' + r.status);
      });
  }

  function b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function ghPutFile(path, contentStr, message) {
    var cfg = ghConfig();
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      return Promise.reject(new Error('GitHub sync is not configured'));
    }
    var url = ghApiBase() + path;
    return fetch(url + '?ref=' + encodeURIComponent(cfg.branch), { headers: ghHeaders() })
      .then(function (r) {
        if (r.status === 200) return r.json().then(function (j) { return j.sha; });
        if (r.status === 404) return null;
        throw new Error('Failed to read current file (HTTP ' + r.status + ')');
      })
      .then(function (sha) {
        return fetch(url, {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
          body: JSON.stringify({
            message: message,
            content: b64(contentStr),
            branch: cfg.branch,
            sha: sha
          })
        });
      })
      .then(function (r) {
        if (r.ok) return r.json();
        return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.message || ('Commit failed (HTTP ' + (j.message ? '' : r.status) + ')'));
        });
      });
  }

  return {
    ready: ready,
    raw: raw,
    getOverride: getOverride,
    mergeInto: mergeInto,
    ghConfig: ghConfig,
    ghSaveConfig: ghSaveConfig,
    guessRepo: guessRepo,
    ghTest: ghTest,
    ghPutFile: ghPutFile
  };
})();

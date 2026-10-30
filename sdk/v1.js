/*
 * SabiVida Mini Apps SDK, protocol 1.
 * <script src="https://app.sabivida.com/mini-apps/sdk/v1.js"></script>
 * Guide: https://github.com/sabivida-mini-apps/partner-kit/blob/main/docs/developer-guide.md
 *
 * Talks only to the SabiVida page that frames this app: messages go to the
 * SabiVida origins (never '*') and replies count only from the parent window at
 * one of them, then from that origin alone. The launch token is a proof to verify on your server, never a
 * session to keep in the browser.
 */
(function (global) {
  'use strict';
  var script = global.document && global.document.currentScript;
  var attribute = script && script.getAttribute('data-sabivida-host');
  // SabiVida moves from sabivida.com to app.sabivida.com: by default either may
  // frame this app. The first to answer a launch becomes the only host.
  var hosts = attribute ? [attribute] : ['https://app.sabivida.com', 'https://sabivida.com'];
  var host = hosts[0];
  var answered = Boolean(attribute);
  var context = null;
  var waiting = [];
  var tasks = {};
  var counter = 0;

  function embedded() {
    return global.parent !== global;
  }

  function post(message) {
    if (!embedded()) return false;
    message.sabivida = 1;
    // A target origin that is not the parent's drops the message, so asking
    // each possible host reaches only the real one.
    (answered ? [host] : hosts).forEach(function (origin) {
      global.parent.postMessage(message, origin);
    });
    return true;
  }

  global.addEventListener('message', function (event) {
    if (event.source !== global.parent) return;
    if (answered ? event.origin !== host : hosts.indexOf(event.origin) < 0) return;
    var data = event.data;
    if (!data || typeof data !== 'object' || data.sabivida !== 1) return;
    if (!answered) {
      host = event.origin;
      answered = true;
      SabiVida.host = host;
    }
    if (data.type === 'launch' && typeof data.token === 'string') {
      context = data.context || null;
      var ready = waiting;
      waiting = [];
      ready.forEach(function (entry) {
        entry.resolve({ token: data.token, context: context });
      });
    } else if (data.type === 'launch_failed') {
      var failed = waiting;
      waiting = [];
      failed.forEach(function (entry) {
        entry.reject(new Error(data.reason || 'unavailable'));
      });
    } else if (data.type === 'task_result' && tasks[data.requestId]) {
      var resolve = tasks[data.requestId];
      delete tasks[data.requestId];
      resolve(data.status);
    }
  });

  var SabiVida = {
    protocol: 1,
    host: host,
    isEmbedded: embedded,
    // Asks SabiVida for a fresh launch token (60 seconds) and the context.
    ready: function (options) {
      var timeout = (options && options.timeout) || 10000;
      return new Promise(function (resolve, reject) {
        if (!embedded()) return reject(new Error('not_embedded'));
        var entry = { resolve: resolve, reject: reject };
        waiting.push(entry);
        global.setTimeout(function () {
          var index = waiting.indexOf(entry);
          if (index >= 0) {
            waiting.splice(index, 1);
            reject(new Error('timeout'));
          }
        }, timeout);
        post({ type: 'ready' });
      });
    },
    // Context from the last launch: appId, locale, colorScheme, startParam,
    // platform, protocol, features. Display hints only; trust the token.
    context: function () {
      return context;
    },
    supports: function (feature) {
      return Boolean(context && context.features && context.features.indexOf(feature) >= 0);
    },
    // Suggests a step for the member's plans. SabiVida shows the exact text and
    // the member decides: resolves 'added', 'declined' or 'unavailable'.
    addTask: function (task) {
      return new Promise(function (resolve) {
        counter += 1;
        var requestId = 'task-' + Date.now().toString(36) + '-' + counter;
        tasks[requestId] = resolve;
        var sent = post({
          type: 'add_task',
          requestId: requestId,
          title: String((task && task.title) || ''),
          dueDate: (task && task.dueDate) || null,
        });
        if (!sent) {
          delete tasks[requestId];
          resolve('unavailable');
        }
      });
    },
    close: function () {
      post({ type: 'close' });
    },
  };

  global.SabiVida = SabiVida;
})(window);

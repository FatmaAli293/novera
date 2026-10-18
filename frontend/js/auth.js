(function () {
  if (window.__authUiLoaded) return;
  window.__authUiLoaded = true;

  const ACCOUNT_PAGE = 'profile.html';
  const onAccountPage = location.pathname.endsWith(ACCOUNT_PAGE);

  // الهيدر ممكن يتحط متأخر (layout.js)، فنستنى الأيقونة تظهر
  function whenHeaderReady(cb, tries = 0) {
    const acc = document.querySelector('.icons a[aria-label="Account"]');
    if (acc) return cb(acc);
    if (tries > 40) return;
    setTimeout(() => whenHeaderReady(cb, tries + 1), 100);
  }

  async function init(acc) {
    const icons = acc.parentElement;

    // امسحي أي زرار Login / Hi قديم
    icons.querySelectorAll('.login-link, .header-login, .hello, #headerAuthBtn, .auth-slot')
         .forEach(el => el.remove());

    // حاوية واحدة للزرار
    const slot = document.createElement('span');
    slot.className = 'auth-slot';
        slot.style.cssText = 'display:flex;align-items:center;white-space:nowrap;margin-right:8px;';
    acc.before(slot);

    let user = null;
    try {
      const res = await fetch('/venora/backend/api/auth.php?action=me', { credentials: 'same-origin' });
      user = (await res.json()).user;
    } catch (e) {}

    /* ===== زائر ===== */
    if (!user) {
      const login = document.createElement('a');
      login.href = 'login.html';
      login.className = 'login-link';
      login.textContent = 'Login';
      slot.appendChild(login);

      const toast = document.createElement('div');
      toast.className = 'auth-toast';
      toast.innerHTML =
        'Please log in first to see your account and your orders.' +
        '<br><a href="login.html" id="toastLogin">Log in</a>';
      document.body.appendChild(toast);

      toast.querySelector('#toastLogin').addEventListener('click', () => {
        sessionStorage.setItem('venora_next', ACCOUNT_PAGE);
      });

      let timer;
      acc.addEventListener('click', e => {
        e.preventDefault();
        toast.classList.add('show');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('show'), 5000);
      });
      document.addEventListener('click', e => {
        if (!toast.contains(e.target) && !acc.contains(e.target)) toast.classList.remove('show');
      });
      return;
    }

        /* ===== داخل ===== */
    const hi = document.createElement('a');
    hi.href = ACCOUNT_PAGE;
    hi.className = 'login-link';
    hi.textContent = 'Hi, ' + user.name.split(' ')[0];

    slot.appendChild(hi);
    acc.title = 'My account';

    // لو أنتِ في الداشبورد: الضغط ما يودّيش في أي مكان
    if (onAccountPage) {
      acc.addEventListener('click', e => e.preventDefault());
      hi.addEventListener('click', e => e.preventDefault());
    }
  }

  whenHeaderReady(init);
})();
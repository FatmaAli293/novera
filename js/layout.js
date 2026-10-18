(async function () {
  const top = document.getElementById('site-header');
  const bottom = document.getElementById('site-footer');

  // 1) الهيدر والفوتر من index.html
  try {
    const html = await (await fetch('index.html')).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (top) top.replaceWith(doc.querySelector('header'));
    if (bottom) bottom.replaceWith(doc.querySelector('footer'));
  } catch (e) {}

  // 2) السلة: زرار Add to cart وعداد الهيدر
  document.head.appendChild(Object.assign(document.createElement('script'), { src: 'js/cart.js' }));

  // 3) تمييز اللينك الحالي في القائمة
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === file));

  // 4) زرار Log in / Hi, الاسم (بعد ما الهيدر يتحط)
  document.head.appendChild(Object.assign(document.createElement('script'), { src: 'js/auth.js?v=' + Date.now() }));
})();
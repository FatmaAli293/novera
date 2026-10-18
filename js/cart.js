/**
 * VENORA Cart – localStorage
 * كل منتج لازم ييجي من الداتابيز:
 * { id, name, price, image, qty }
 */

const CART_KEY = 'venora_cart';
const NOTES_KEY = 'venora_cart_notes';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateBadge();
}

function getNotes() {
  return localStorage.getItem(NOTES_KEY) || '';
}

function saveNotes(text) {
  localStorage.setItem(NOTES_KEY, text);
}

function formatPrice(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' EGP';
}

function updateBadge() {
  const cart = getCart();
  const totalQty = cart.reduce((s, i) => s + Number(i.qty), 0);
  document.querySelectorAll('#cartBadge, .cart-badge').forEach(badge => {
    if (!badge) return;
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'grid' : 'none';
  });
}

function renderCart() {
  const cart = getCart();
  const emptyEl = document.getElementById('cartEmpty');
  const panelEl = document.getElementById('cartPanel');
  const itemsEl = document.getElementById('cartItems');

  if (!emptyEl || !panelEl || !itemsEl) {
    updateBadge();
    return;
  }

  if (!cart.length) {
    emptyEl.hidden = false;
    panelEl.hidden = true;
    updateBadge();
    return;
  }

  emptyEl.hidden = true;
  panelEl.hidden = false;

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.image || 'images/hero.jpeg'}" alt="${item.name}"
             onerror="this.src='images/hero.jpeg'">
      </div>
      <div class="cart-item-info">
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-price">${formatPrice(item.price)} each</p>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button type="button" class="qty-btn qty-minus" aria-label="Decrease">−</button>
          <span class="qty-value">${item.qty}</span>
          <button type="button" class="qty-btn qty-plus" aria-label="Increase">+</button>
        </div>
        <button type="button" class="remove-btn" aria-label="Remove">×</button>
      </div>
      <div class="cart-item-line-total">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (totalEl) totalEl.textContent = formatPrice(subtotal);

  const notesEl = document.getElementById('cartNotes');
  if (notesEl) notesEl.value = getNotes();

  updateBadge();
  bindItemEvents();
}

function bindItemEvents() {
  document.querySelectorAll('.cart-item').forEach(row => {
    const id = row.dataset.id;

    row.querySelector('.qty-plus')?.addEventListener('click', () => changeQty(id, 1));
    row.querySelector('.qty-minus')?.addEventListener('click', () => changeQty(id, -1));
    row.querySelector('.remove-btn')?.addEventListener('click', () => removeItem(id));
  });
}

function changeQty(id, delta) {
  let cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;

  item.qty = Number(item.qty) + delta;
  if (item.qty < 1) {
    cart = cart.filter(i => String(i.id) !== String(id));
  }
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter(i => String(i.id) !== String(id));
  saveCart(cart);
  renderCart();
}

function clearCart() {
  if (!confirm('Clear all items from your cart?')) return;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(NOTES_KEY);
  renderCart();
}

/* ===== API العامة — استخدميها من صفحات المنتجات ===== */
window.VenoraCart = {
  /**
   * أضيفي منتج من الداتابيز
   * product = { id, name, price, image }
   * الأسعار والاسم والصورة لازم تيجي من الـ API
   */
  add(product) {
    if (!product || !product.id) {
      console.error('VenoraCart.add: product must have id, name, price');
      return;
    }
    const cart = getCart();
    const existing = cart.find(i => String(i.id) === String(product.id));
    if (existing) {
      existing.qty = Number(existing.qty) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || '',
        qty: 1
      });
    }
    saveCart(cart);
    updateBadge();
    return cart;
  },
  get: getCart,
  clear: () => {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(NOTES_KEY);
    updateBadge();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  const notesEl = document.getElementById('cartNotes');
  if (notesEl) {
    notesEl.addEventListener('input', () => saveNotes(notesEl.value));
  }
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const cart = getCart();
      if (!cart.length) return;

      try {
        // لازم يكون عامل login (من السيشن في السيرفر)
        const me = await (await fetch('/venora/backend/api/auth.php?action=me')).json();
        if (!me.user) {
          alert('Please log in first to place your order.');
          window.location.href = 'profile.html';
          return;
        }

        const res = await fetch('/venora/backend/api/orders.php?action=create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(i => ({ id: Number(i.id), qty: Number(i.qty) }))
          })
        });
        const data = await res.json();

                if (!res.ok) {
          alert((data.error || 'Could not place the order.') + (data.detail ? '\n' + data.detail : ''));
          return;
        }

        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(NOTES_KEY);
        updateBadge();

        alert('Order placed successfully!');
        window.location.href = 'orders.html';
      } catch (err) {
        alert('Could not reach the server.');
      }
    });
  }
  updateBadge();
});
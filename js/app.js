async function loadCategories() {
    const box = document.getElementById('cards');
    if (!box) return;

    try {
        const res = await fetch('/venora/backend/api/categories.php');
        const categories = await res.json();

        box.innerHTML = categories.map(c => `
            <a class="card" href="category.html?id=${c.category_id}">
                <img src="${c.image_url}" alt="${c.category_name}">
                <span>${c.category_name}</span>
            </a>
        `).join('');

    } catch (err) {
        box.textContent = 'Could not load categories.';
    }
}

loadCategories();

// زرار Log in للزائر، و"Hi, الاسم" للمستخدم الداخل
document.head.appendChild(Object.assign(document.createElement('script'), { src: 'js/auth-ui.js' }));

// السلة: عداد الهيدر
document.head.appendChild(Object.assign(document.createElement('script'), { src: 'js/cart.js' }));
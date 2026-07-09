const CART_KEY = 'edible-image-cart';
const PRODUCT_IMAGES = {
  'sheet-cake': 'img/sheet-cake.png',
  'round-cake': 'img/round-cake.png',
  'cupcake': 'img/cupcake.png',
  'cookie': 'img/cookie1.png',
  'custom-shape': 'img/custom-shape.png',
};

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countElements = document.querySelectorAll('[data-cart-count]');
  const cart = loadCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  countElements.forEach((element) => {
    element.textContent = totalCount;
  });
}

function addToCart(product) {
  const cart = loadCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      quantity: 1,
    });
  }

  saveCart(cart);
  alert(`${product.name} added to cart.`);
}

function updateQuantity(productId, delta) {
  const cart = loadCart();
  const item = cart.find((entry) => entry.id === productId);

  if (!item) return;

  item.quantity += delta;

  if (item.quantity < 1) {
    const index = cart.findIndex((entry) => entry.id === productId);
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCartPage();
}

function removeItem(productId) {
  const cart = loadCart().filter((entry) => entry.id !== productId);
  saveCart(cart);
  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
}

function renderCartPage() {
  const cartContent = document.getElementById('cart-content');
  if (!cartContent) return;

  const cart = loadCart();

  if (cart.length === 0) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <h3>Your cart is empty</h3>
        <p>Add items from the products or gallery pages to start building your order.</p>
        <a class="button button-primary" href="index.html">Continue shopping</a>
      </div>
    `;
    return;
  }

  const rows = cart.map((item) => `
    <div class="cart-row">
      <img class="cart-thumbnail" src="${PRODUCT_IMAGES[item.id] || 'img/sheet-cake.png'}" alt="${item.name}" />
      <div class="cart-product">
        <span>${item.name}</span>
        <small>${item.quantity} item(s)</small>
      </div>
      <div class="cart-controls">
        <button class="button button-secondary quantity-button" type="button" data-action="decrease" data-product-id="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button class="button button-secondary quantity-button" type="button" data-action="increase" data-product-id="${item.id}">+</button>
      </div>
      <button class="button button-secondary remove-item" type="button" data-product-id="${item.id}">Remove</button>
    </div>
  `).join('');

  cartContent.innerHTML = `
    <div class="cart-list">${rows}</div>
    <div class="cart-request-panel">
      <h3>Upload your image</h3>
      <p>Attach your design and submit the full cart request for review.</p>
      <form id="cart-request-form" class="cart-request-form">
        <label class="form-field">
          <span>Your name</span>
          <input type="text" name="customerName" placeholder="Your name" required />
        </label>
        <label class="form-field">
          <span>Email</span>
          <input type="email" name="customerEmail" placeholder="you@example.com" required />
        </label>
        <label class="form-field">
          <span>Upload your image</span>
          <input type="file" name="customImage" accept="image/*" required />
        </label>
        <div id="image-preview-container" class="image-preview-container"></div>
        <div class="cart-actions">
          <button class="button button-primary" id="checkout-button" type="submit">Submit request</button>
          <button class="button button-secondary" id="clear-cart-button" type="button">Clear cart</button>
        </div>
      </form>
    </div>
  `;

  attachCartActionListeners();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function attachCartActionListeners() {
  const decreaseButtons = document.querySelectorAll('[data-action="decrease"]');
  const increaseButtons = document.querySelectorAll('[data-action="increase"]');
  const removeButtons = document.querySelectorAll('.remove-item');
  const clearButton = document.getElementById('clear-cart-button');
  const cartRequestForm = document.getElementById('cart-request-form');

  decreaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateQuantity(button.dataset.productId, -1);
    });
  });

  increaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateQuantity(button.dataset.productId, 1);
    });
  });

  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      removeItem(button.dataset.productId);
    });
  });

  if (clearButton) {
    clearButton.addEventListener('click', clearCart);
  }

  if (!cartRequestForm) return;

  const fileInput = cartRequestForm.elements.customImage;
  const previewContainer = document.getElementById('image-preview-container');

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        previewContainer.innerHTML = '';
        return;
      }

      try {
        const previewUrl = await readFileAsDataUrl(file);
        previewContainer.innerHTML = `<img class="upload-preview" src="${previewUrl}" alt="Uploaded preview" />`;
      } catch (error) {
        previewContainer.innerHTML = '<p class="upload-error">Unable to preview this image.</p>';
      }
    });
  }

  cartRequestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const cart = loadCart();
    const name = cartRequestForm.elements.customerName.value.trim();
    const email = cartRequestForm.elements.customerEmail.value.trim();
    const imageFile = fileInput?.files?.[0];

    if (cart.length === 0) {
      alert('Your cart is empty. Add items first.');
      return;
    }

    if (!name || !email || !imageFile) {
      alert('Please enter your name, email, and upload your image.');
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(imageFile);
      const requests = JSON.parse(localStorage.getItem('edible-image-requests') || '[]');
      requests.push({
        name,
        email,
        image: imageDataUrl,
        items: cart,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('edible-image-requests', JSON.stringify(requests));

      alert(`Thanks, ${name}! Your cart request has been received. We will contact you shortly at ${email}.`);
      clearCart();
      cartRequestForm.reset();
      if (previewContainer) {
        previewContainer.innerHTML = '';
      }
    } catch (error) {
      alert('We could not process your request. Please try again.');
    }
  });
}

function initProductImageGallery() {
  document.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
    const images = gallery.querySelectorAll('.product-card-image');
    let currentIndex = 0;

    gallery.addEventListener('mouseenter', () => {
      if (images.length <= 1) return;

      const interval = setInterval(() => {
        images[currentIndex].style.opacity = '0';
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].style.opacity = '1';
      }, 900);

      gallery.dataset.interval = interval;
    });

    gallery.addEventListener('mouseleave', () => {
      if (gallery.dataset.interval) {
        clearInterval(parseInt(gallery.dataset.interval));
        delete gallery.dataset.interval;
      }
      images.forEach((img, idx) => {
        img.style.opacity = idx === 0 ? '1' : '0';
      });
      currentIndex = 0;
    });

    images.forEach((image) => {
      image.addEventListener('click', (event) => {
        event.stopPropagation();
        openProductModal(image);
      });
    });
  });
}

function openProductModal(image) {
  const modal = document.getElementById('product-modal');
  const modalImage = document.getElementById('product-modal-image');
  const modalTitle = document.getElementById('product-modal-title');
  const modalDescription = document.getElementById('product-modal-description');
  const modalAddButton = document.getElementById('product-modal-add');
  const modalThumbs = document.getElementById('product-modal-thumbs');

  if (!modal || !modalImage || !modalTitle || !modalDescription || !modalAddButton || !modalThumbs) return;

  const card = image.closest('.product-card');
  const title = card?.querySelector('h3')?.textContent?.trim() || 'Product';
  const description = card?.querySelector('p')?.textContent?.trim() || 'Premium edible image design.';
  const addButton = card?.querySelector('.add-cart');
  const images = Array.from(card?.querySelectorAll('.product-card-image') || []);
  const startIndex = images.indexOf(image);

  modalTitle.textContent = title;
  modalDescription.textContent = description;

  modalThumbs.innerHTML = '';
  images.forEach((thumbImage, index) => {
    const thumbButton = document.createElement('button');
    thumbButton.type = 'button';
    thumbButton.className = 'product-modal-thumb';
    thumbButton.setAttribute('aria-label', `View image ${index + 1}`);
    if (index === startIndex) {
      thumbButton.classList.add('is-active');
    }

    const thumbImg = document.createElement('img');
    thumbImg.src = thumbImage.src;
    thumbImg.alt = thumbImage.alt;
    thumbButton.appendChild(thumbImg);

    thumbButton.addEventListener('click', () => {
      setProductModalImage(index, images, modalImage, modalThumbs);
    });

    modalThumbs.appendChild(thumbButton);
  });

  setProductModalImage(startIndex >= 0 ? startIndex : 0, images, modalImage, modalThumbs);

  modalAddButton.onclick = () => {
    if (addButton?.dataset.productId && addButton?.dataset.productName) {
      addToCart({
        id: addButton.dataset.productId,
        name: addButton.dataset.productName,
      });
    }
  };

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function setProductModalImage(index, images, modalImage, modalThumbs) {
  if (!images.length) return;

  const safeIndex = (index + images.length) % images.length;
  const selectedImage = images[safeIndex];
  modalImage.src = selectedImage.src;
  modalImage.alt = selectedImage.alt;

  modalThumbs.querySelectorAll('.product-modal-thumb').forEach((thumb, thumbIndex) => {
    thumb.classList.toggle('is-active', thumbIndex === safeIndex);
  });
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initCart() {
  updateCartCount();
  initProductImageGallery();

  document.querySelectorAll('.add-cart').forEach((button) => {
    button.addEventListener('click', () => {
      addToCart({
        id: button.dataset.productId,
        name: button.dataset.productName,
      });
    });
  });

  renderCartPage();

  document.querySelectorAll('[data-close-product-modal]').forEach((element) => {
    element.addEventListener('click', closeProductModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProductModal();
    }
  });

  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();

    if (!name || !email) {
      alert('Please fill in your name and email.');
      return;
    }

    alert(`Thanks, ${name}!\nYour order request has been received. We'll contact you shortly at ${email}.`);
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', initCart);

console.log('theme.js loaded');

// Header scroll behavior
document.addEventListener('DOMContentLoaded', function () {
    let lastScroll = 0;
    const header = document.querySelector('.site-header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scrolling down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scrolling up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }

        lastScroll = currentScroll;
    });

    // Search form handling
    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm?.querySelector('input[type="search"]');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            if (!searchInput.value.trim()) {
                e.preventDefault();
            }
        });

        // Add focus styles
        searchInput.addEventListener('focus', () => {
            searchForm.classList.add('is-focused');
        });

        searchInput.addEventListener('blur', () => {
            searchForm.classList.remove('is-focused');
        });
    }

    // Mobile menu handling (if needed in the future)
    const setupMobileMenu = () => {
        // Placeholder for future mobile menu implementation
    };

    // Cart count animation
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const animateCount = () => {
            cartCount.classList.add('pulse');
            setTimeout(() => {
                cartCount.classList.remove('pulse');
            }, 300);
        };

        // Example: Animate when cart count changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    animateCount();
                }
            });
        });

        observer.observe(cartCount, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Product page functionality
    const productTemplate = document.querySelector('.product-template');
    if (!productTemplate) return;

    // Image gallery
    const thumbnailButtons = productTemplate.querySelectorAll('.thumbnail-button');
    const galleryItems = productTemplate.querySelectorAll('.gallery-item');

    thumbnailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const imageId = button.dataset.imageId;

            // Update active states
            thumbnailButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show selected image
            galleryItems.forEach(item => {
                if (item.dataset.imageId === imageId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    });

    // Add to Cart functionality
    const handleAddToCart = () => {
        // This grabs all <form> elements on the page that submit to the URL /cart/add.
        // In Shopify, this URL is used to add a product to the cart via JavaScript (AJAX).
        const productForms = document.querySelectorAll('form[action="/cart/add"]');

        productForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = form.querySelector('[data-add-to-cart]');
                const formMessage = form.querySelector('[data-form-message]');

                if (submitButton.classList.contains('is-loading')) return;

                // Show loading state
                submitButton.classList.add('is-loading');
                submitButton.disabled = true;

                try {


                    // FormData(form) takes the form fields (like product ID, quantity, variant) and packages them up.
                    const formData = new FormData(form);
                    // This is sent using fetch() to /cart/add.js, which is Shopify’s AJAX API for adding products to the cart.
                    const response = await fetch('/cart/add.js', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Network response was not ok');

                    const data = await response.json();

                    // Update cart count with animation
                    const cartCount = document.querySelector('.cart-count');
                    const getCartResponse = await fetch('/cart.js');
                    const cart = await getCartResponse.json();

                    if (cartCount) {
                        cartCount.textContent = cart.item_count;
                        cartCount.classList.remove('pulse');
                        // Trigger reflow
                        void cartCount.offsetWidth;
                        cartCount.classList.add('pulse');
                    }

                    // Show success message
                    if (formMessage) {
                        formMessage.textContent = 'Item added to cart!';
                        formMessage.classList.remove('error');
                        formMessage.classList.add('success');
                    }

                } catch (error) {
                    console.error('Error:', error);
                    if (formMessage) {
                        formMessage.textContent = 'Error adding item to cart. Please try again.';
                        formMessage.classList.remove('success');
                        formMessage.classList.add('error');
                    }
                } finally {
                    // Remove loading state after a slight delay for better UX
                    setTimeout(() => {
                        submitButton.classList.remove('is-loading');
                        submitButton.disabled = false;
                    }, 600);

                    // Hide message after 5 seconds
                    if (formMessage) {
                        setTimeout(() => {
                            formMessage.classList.remove('success', 'error');
                            formMessage.textContent = '';
                        }, 5000);
                    }
                }
            });
        });
    };

    // Initialize add to cart functionality
    handleAddToCart();

    // Variant selection
    const variantSelects = productTemplate.querySelectorAll('.select-variant');
    const variantIdInput = productTemplate.querySelector('[data-variant-id]');
    const addToCartButton = productTemplate.querySelector('[data-add-to-cart]');
    const priceElement = productTemplate.querySelector('[data-regular-price]');

    if (variantSelects.length && window.productVariants) {
        const updatePrice = (variant) => {
            if (!variant) return;

            if (priceElement) {
                priceElement.innerHTML = formatMoney(variant.price);
            }

            if (variantIdInput) {
                variantIdInput.value = variant.id;
            }

            if (addToCartButton) {
                if (variant.available) {
                    addToCartButton.removeAttribute('disabled');
                    addToCartButton.querySelector('.button-text').textContent = 'Add to cart';
                } else {
                    addToCartButton.setAttribute('disabled', 'disabled');
                    addToCartButton.querySelector('.button-text').textContent = 'Sold out';
                }
            }
        };

        const getSelectedVariant = () => {
            const selections = [];
            variantSelects.forEach(select => {
                selections.push(select.value);
            });

            return window.productVariants.find(variant =>
                variant.options.every((option, index) =>
                    option === selections[index]
                )
            );
        };

        variantSelects.forEach(select => {
            select.addEventListener('change', () => {
                const variant = getSelectedVariant();
                updatePrice(variant);

                // Update URL with variant ID
                if (variant) {
                    const url = new URL(window.location);
                    url.searchParams.set('variant', variant.id);
                    window.history.replaceState({}, '', url.toString());
                }
            });
        });
    }

    // Helper function to format money
    function formatMoney(cents) {
        const formatOptions = {
            style: 'currency',
            currency: window.Shopify?.currency?.active || 'USD'
        };
        return (cents / 100).toLocaleString(undefined, formatOptions);
    }

    // Account dropdown functionality
    const setupAccountDropdown = () => {
        const accountButton = document.querySelector('.account-button');
        const customerDropdown = document.querySelector('#customer-dropdown');
        const dropdownLinks = customerDropdown?.querySelectorAll('a');

        if (accountButton && customerDropdown) {
            // Toggle dropdown
            accountButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = accountButton.getAttribute('aria-expanded') === 'true';
                toggleDropdown(!isExpanded);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!accountButton.contains(e.target) && !customerDropdown.contains(e.target)) {
                    toggleDropdown(false);
                }
            });

            // Keyboard navigation
            accountButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const isExpanded = accountButton.getAttribute('aria-expanded') === 'true';
                    toggleDropdown(!isExpanded);
                } else if (e.key === 'Escape') {
                    toggleDropdown(false);
                }
            });

            // Arrow key navigation within dropdown
            customerDropdown.addEventListener('keydown', (e) => {
                const focusableElements = Array.from(dropdownLinks);
                const currentIndex = focusableElements.indexOf(document.activeElement);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                    focusableElements[nextIndex].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                    focusableElements[prevIndex].focus();
                } else if (e.key === 'Escape') {
                    toggleDropdown(false);
                    accountButton.focus();
                }
            });
        }

        function toggleDropdown(show) {
            accountButton.setAttribute('aria-expanded', show);
            customerDropdown.hidden = !show;

            if (show && dropdownLinks?.length) {
                dropdownLinks[0].focus();
            }
        }
    };

    // Initialize account dropdown
    setupAccountDropdown();
});

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

    // Variant selection
    const variantSelects = productTemplate.querySelectorAll('.select-variant');
    const addToCartButton = productTemplate.querySelector('[data-add-to-cart]');
    const priceElement = productTemplate.querySelector('[data-regular-price]');

    if (variantSelects.length && window.productVariants) {
        const updatePrice = (variant) => {
            if (!variant) return;

            if (priceElement) {
                priceElement.innerHTML = formatMoney(variant.price);
            }

            if (addToCartButton) {
                if (variant.available) {
                    addToCartButton.removeAttribute('disabled');
                    addToCartButton.textContent = 'Add to cart';
                } else {
                    addToCartButton.setAttribute('disabled', 'disabled');
                    addToCartButton.textContent = 'Sold out';
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
});

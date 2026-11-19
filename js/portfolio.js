window.addEventListener('DOMContentLoaded', async () => {
    const read = async name => {
        const r = await fetch(`./content/${name}.json`, {cache: 'no-cache'});
        if (!r.ok) throw Error(`${name}.json: HTTP ${r.status}`);
        return r.json();
    };

    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };

    try {
        const [slides, photos] = await Promise.all([
            read('carousel'),
            read('gallery')
        ]);

        // Carousel
        const carousel = document.querySelector('#carouselExampleIndicators');
        if (carousel) {
            const indicators = carousel.querySelector('.carousel-indicators');
            const inner = carousel.querySelector('.carousel-inner');
            indicators.replaceChildren();
            inner.replaceChildren();

            slides.forEach((x, i) => {
                const button = el('button');
                button.type = 'button';
                button.dataset.bsTarget = '#carouselExampleIndicators';
                button.dataset.bsSlideTo = String(i);
                button.setAttribute('aria-label', `Slide ${i + 1}`);

                if (i === 0) {
                    button.classList.add('active');
                    button.setAttribute('aria-current', 'true');
                }
                indicators.append(button);

                const slide = el('div', `carousel-item${i === 0 ? ' active' : ''}`);
                const img = el('img', 'd-block w-100');
                img.src = x.image || '';
                img.alt = x.title || `Slide ${i + 1}`;
                img.loading = i === 0 ? 'eager' : 'lazy';

                const caption = el('div', 'carousel-caption');
                caption.append(
                    el('h5', '', x.title || ''),
                    el('p', '', x.caption || '')
                );
                slide.append(img, caption);
                inner.append(slide);
            });

            if (window.bootstrap?.Carousel)
                bootstrap.Carousel.getOrCreateInstance(carousel, {
                    interval: 5000,
                    ride: 'carousel'
                });
        }

        // Gallery
        const gallery = document.querySelector('.row.images');
        if (gallery) {
            gallery.replaceChildren();

            photos.forEach((x, i) => {
                const column = el(
                    'div',
                    `col-md-4 col-sm-6 gallery-item${i >= 3 ? ' hidden' : ''}`
                );
                const container = el('div', 'image-container');
                const img = el('img', 'img-fluid');
                img.src = x.image || '';
                img.alt = x.title || x.caption || `Gallery image ${i + 1}`;
                img.loading = 'lazy';

                const overlay = el('div', 'overlay');
                overlay.append(el('div', 'text', x.caption || x.title || ''));

                container.append(img, overlay);
                column.append(container);
                gallery.append(column);
            });

            if (photos.length > 3) {
                const wrapper = el('div', 'text-center mt-3');
                const button = el('button', 'btn btn-primary', 'Load More');
                button.type = 'button';
                button.addEventListener('click', () => {
                    gallery.querySelectorAll('.gallery-item.hidden')
                        .forEach(item => item.classList.remove('hidden'));
                    wrapper.remove();
                });
                wrapper.append(button);
                gallery.parentElement.append(wrapper);
            }
        }
    } catch (error) {
        console.error('Could not load portfolio content:', error);
    }
});
